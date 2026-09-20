import json
import os

from dotenv import load_dotenv
from mistralai.client import Mistral


# Load .env before reading the API key
load_dotenv()


MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")


if not MISTRAL_API_KEY:
    raise RuntimeError(
        "MISTRAL_API_KEY is not set. "
        "Please add it to the .env file."
    )


client = Mistral(api_key=MISTRAL_API_KEY)


SYSTEM_PROMPT = """
You are ContractLens, an AI contract intelligence agent.

Your job is to analyze business contracts and convert them into
structured, actionable information.

You are NOT a lawyer and must not provide legal advice.

Analyze only the information present in the provided document.
Do not invent facts.

Return ONLY valid JSON.

The JSON must follow this structure:

{
  "contract_overview": {
    "contract_type": "",
    "parties": [],
    "effective_date": "",
    "expiration_date": "",
    "renewal_terms": "",
    "payment_terms": ""
  },
  "termination": {
    "termination_conditions": "",
    "notice_period": ""
  },
  "important_clauses": [],
  "obligations": [
    {
      "party": "",
      "obligation": "",
      "deadline_or_frequency": "",
      "source": {
        "page": "",
        "clause": ""
      }
    }
  ],
  "key_dates": [
    {
      "date": "",
      "event": "",
      "source": {
        "page": "",
        "clause": ""
      }
    }
  ]
}

Rules:

1. Use empty strings when information is not available.
2. Use empty arrays when no items are found.
3. Do not guess missing dates, parties, obligations, or clauses.
4. Every obligation should include a source page when possible.
5. Every key date should include a source page when possible.
6. Keep important clauses concise.
7. Preserve exact facts from the document.
8. Return JSON only. Do not use Markdown code fences.
"""


def analyze_contract(contract_text):
    """
    Send extracted contract text to Mistral and return structured JSON.
    """

    if not contract_text or not contract_text.strip():
        raise ValueError("Contract text is empty.")

    contract_text = contract_text[:30000]

    response = client.chat.complete(
        model="ministral-3b-2512",
        messages=[
            {
                "role": "system",
                "content": SYSTEM_PROMPT
            },
            {
                "role": "user",
                "content": (
                    "Analyze the following document.\n\n"
                    "DOCUMENT:\n"
                    f"{contract_text}"
                )
            }
        ],
        temperature=0.1
    )

    content = response.choices[0].message.content

    if not content:
        raise ValueError("Mistral returned an empty response.")

    content = content.strip()

    if content.startswith("```"):
        content = content.replace("```json", "", 1)
        content = content.replace("```", "", 1)
        content = content.strip()

    try:
        return json.loads(content)

    except json.JSONDecodeError as error:
        raise ValueError(
            f"Mistral returned invalid JSON: {error}"
        ) from error