from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
from werkzeug.utils import secure_filename

from utils.pdf_reader import extract_pdf_text
from utils.contract_analyzer import analyze_contract

from mistralai.client import Mistral

import os
import uuid


# Load environment variables
load_dotenv()


app = Flask(__name__)

app.secret_key = os.getenv(
    "FLASK_SECRET_KEY",
    "contractlens-dev-key"
)


# Upload configuration
UPLOAD_FOLDER = "uploads"
ALLOWED_EXTENSIONS = {"pdf"}

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER


# Create upload folder if it does not exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# Mistral client
MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")

if not MISTRAL_API_KEY:
    raise RuntimeError(
        "MISTRAL_API_KEY is not set. "
        "Please add it to the .env file."
    )

mistral_client = Mistral(
    api_key=MISTRAL_API_KEY
)


# Store uploaded contract text in memory
contracts = {}


def allowed_file(filename):
    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower()
        in ALLOWED_EXTENSIONS
    )


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/upload-contract", methods=["POST"])
def upload_contract():

    if "contract" not in request.files:
        return jsonify({
            "error": "No contract file was uploaded."
        }), 400

    file = request.files["contract"]

    if file.filename == "":
        return jsonify({
            "error": "Please select a PDF contract."
        }), 400

    if not allowed_file(file.filename):
        return jsonify({
            "error": "Only PDF files are supported."
        }), 400

    original_filename = secure_filename(file.filename)

    file_id = str(uuid.uuid4())

    filename = f"{file_id}_{original_filename}"

    file_path = os.path.join(
        app.config["UPLOAD_FOLDER"],
        filename
    )

    try:
        # 1. Save PDF
        file.save(file_path)

        # 2. Extract PDF text
        pdf_data = extract_pdf_text(file_path)

        if not pdf_data["full_text"].strip():
            return jsonify({
                "error": "Could not extract readable text from this PDF."
            }), 400

        # 3. Analyze contract using Mistral
        analysis = analyze_contract(
            pdf_data["full_text"]
        )

        # 4. Store contract text for Q&A
        contracts[file_id] = {
            "filename": original_filename,
            "text": pdf_data["full_text"],
            "analysis": analysis
        }

        # 5. Return structured analysis
        return jsonify({
            "message": "Contract analyzed successfully.",
            "contract_id": file_id,
            "filename": original_filename,
            "pages": len(pdf_data["pages"]),
            "text_length": len(pdf_data["full_text"]),
            "analysis": analysis
        })

    except Exception as error:

        print("Contract processing error:", error)

        return jsonify({
            "error": f"Could not analyze the contract: {str(error)}"
        }), 500


@app.route("/ask-contract", methods=["POST"])
def ask_contract():

    data = request.get_json(silent=True) or {}

    contract_id = data.get("contract_id")
    question = data.get("question", "").strip()

    if not contract_id:
        return jsonify({
            "error": "No contract selected."
        }), 400

    if not question:
        return jsonify({
            "error": "Please enter a question."
        }), 400

    contract = contracts.get(contract_id)

    if not contract:
        return jsonify({
            "error": "Contract session not found. Please upload the contract again."
        }), 404

    contract_text = contract["text"]

    # Keep the prompt within a reasonable size
    contract_text = contract_text[:30000]

    system_prompt = """
You are ContractLens, an AI contract intelligence assistant.

Answer questions using ONLY the provided contract.

You are NOT a lawyer and must not provide legal advice.

Do not invent facts.

Return ONLY valid JSON in this structure:

{
  "answer": "",
  "source": {
    "page": "",
    "clause": ""
  }
}

Rules:

1. Answer directly and concisely.
2. If the answer is not present in the contract, say:
   "The contract does not specify this information."
3. Do not guess.
4. Include the relevant page when available.
5. Include the relevant clause when available.
6. Preserve facts from the contract.
7. Return JSON only.
"""

    user_prompt = f"""
CONTRACT:

{contract_text}

QUESTION:

{question}
"""

    try:

        response = mistral_client.chat.complete(
            model="ministral-3b-2512",
            messages=[
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": user_prompt
                }
            ],
            temperature=0.1
        )

        content = response.choices[0].message.content

        if not content:
            raise ValueError(
                "Mistral returned an empty response."
            )

        content = content.strip()

        if content.startswith("```"):
            content = content.replace(
                "```json",
                "",
                1
            )

            content = content.replace(
                "```",
                "",
                1
            )

            content = content.strip()

        import json

        answer_data = json.loads(content)

        return jsonify({
            "question": question,
            "answer": answer_data.get(
                "answer",
                "No answer available."
            ),
            "source": answer_data.get(
                "source",
                {}
            )
        })

    except json.JSONDecodeError as error:

        print("Q&A JSON error:", error)

        return jsonify({
            "error": "Could not understand the AI response."
        }), 500

    except Exception as error:

        print("Contract Q&A error:", error)

        return jsonify({
            "error": f"Could not answer the question: {str(error)}"
        }), 500


if __name__ == "__main__":
    app.run(debug=True)