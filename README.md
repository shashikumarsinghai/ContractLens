# ContractLens

AI-powered contract intelligence agent that turns lengthy business contracts into actionable obligations, deadlines, key clauses, and source-backed answers.

## Overview

Business contracts often contain important deadlines, payment terms, renewal conditions, termination clauses, and responsibilities that can be difficult to track manually.

**ContractLens** analyzes a business contract and converts the document into structured, actionable contract intelligence.

Instead of simply summarizing a contract, ContractLens focuses on answering:

- What are the important contract terms?
- Who is responsible for what?
- When does an obligation need to be completed?
- What are the important deadlines?
- What does the contract say about termination?
- Where in the contract did this information come from?

## Key Features

- PDF contract upload
- Automatic PDF text extraction
- AI-powered contract analysis
- Structured contract overview
- Party identification
- Payment term extraction
- Renewal term extraction
- Termination condition analysis
- Obligation extraction
- Deadline and key-date identification
- Important clause extraction
- Source references with page and clause information
- Natural-language contract Q&A
- Deadline timeline
- Contract intelligence dashboard
- Error handling for invalid uploads and server/API issues

## How It Works

    Business Contract PDF
            ↓
    PDF Text Extraction
            ↓
    AI Contract Analysis
            ↓
    Structured Contract Data
            ↓
    ┌───────────────────────────────┐
    │ Contract Overview             │
    │ Obligations                   │
    │ Deadlines                     │
    │ Important Clauses             │
    │ Source References             │
    └───────────────────────────────┘
            ↓
    Contract Intelligence Dashboard
            ↓
    Source-Backed Q&A

## Agent Workflow

ContractLens follows a contract intelligence workflow:

1. **Document Analysis**
   - Reads the uploaded contract.
   - Extracts the available text while preserving page boundaries.

2. **Contract Analysis**
   - Identifies contract type, parties, dates, payment terms, renewal terms, and termination conditions.

3. **Obligation Extraction**
   - Identifies what each party is required to do.
   - Extracts deadlines or frequencies when available.

4. **Deadline Identification**
   - Extracts important contract dates and events.

5. **Source Referencing**
   - Connects extracted information to relevant contract pages and clauses.

6. **Contract Q&A**
   - Allows users to ask questions in natural language.
   - Answers are grounded in the uploaded contract.

## Example Questions

Users can ask questions such as:

- What is the termination notice period?
- When does the contract expire?
- What are the payment terms?
- What obligations does the vendor have?
- What happens when the contract renews?

ContractLens returns the answer along with the relevant source information when available.

## Tech Stack

### Backend

- Python
- Flask

### AI

- Mistral AI

### Document Processing

- PyPDF

### Frontend

- HTML
- CSS
- JavaScript
- Bootstrap

### Configuration

- python-dotenv

## Project Structure

    ContractLens/
    │
    ├── app.py
    ├── requirements.txt
    ├── .gitignore
    │
    ├── templates/
    │   └── index.html
    │
    ├── static/
    │   ├── css/
    │   │   └── style.css
    │   │
    │   └── js/
    │       └── app.js
    │
    └── utils/
        ├── contract_analyzer.py
        └── pdf_reader.py

## Installation

### 1. Clone the Repository

    git clone https://github.com/shashikumarsinghai/ContractLens.git

    cd ContractLens

### 2. Create a Virtual Environment

    python -m venv .venv

### 3. Activate the Virtual Environment

For Windows PowerShell:

    .venv\Scripts\Activate.ps1

### 4. Install Dependencies

    pip install -r requirements.txt

### 5. Configure Environment Variables

Create a `.env` file in the project root:

    MISTRAL_API_KEY=your_mistral_api_key
    FLASK_SECRET_KEY=your_secret_key

Do not commit the `.env` file to GitHub.

### 6. Run the Application

    python app.py

The application will be available at:

    http://127.0.0.1:5000

## Example Workflow

1. Open ContractLens.
2. Upload a business contract PDF.
3. Click **Analyze Contract**.
4. ContractLens extracts the contract text.
5. The AI analyzes the document.
6. The dashboard displays:
   - Contract overview
   - Parties
   - Termination information
   - Key dates
   - Deadline timeline
   - Obligations
   - Important clauses
   - Source references
7. Ask questions about the uploaded contract using the Q&A section.

## Why ContractLens?

Traditional contract review often requires manually searching through lengthy documents for important dates, responsibilities, and clauses.

ContractLens aims to make this information easier to understand and act upon by converting static contract documents into structured business intelligence.

### Core Idea

> **Don't just summarize a contract. Turn it into an actionable obligation system.**

## Use Cases

ContractLens can be useful for:

- Small businesses
- Startup founders
- Operations teams
- Vendor management
- Client contracts
- SaaS agreements
- Service agreements
- Business partnerships

## Limitations

ContractLens is currently a prototype and has several limitations:

- PDF text extraction depends on the document format.
- Scanned/image-only PDFs may not contain extractable text.
- AI-generated information may require human verification.
- Source extraction may vary depending on contract structure.
- The current prototype does not provide legal risk scoring.
- The system is not designed to replace professional legal review.

## Disclaimer

**ContractLens is an AI-powered contract intelligence prototype and is not a substitute for professional legal advice.**

Always verify important contractual information against the original contract and consult a qualified legal professional when appropriate.

## Hackathon Project

ContractLens was built as an AI agent prototype for the **Product Space Agentic AI Hackathon '26**.

The project focuses on using AI to transform unstructured business contracts into actionable obligations, deadlines, and source-backed contract intelligence.

## Future Improvements

Potential future improvements include:

- More advanced document retrieval
- Better clause-level source mapping
- Support for additional document formats
- Improved handling of scanned documents
- Contract comparison
- Automated reminders
- Calendar integration
- More advanced obligation tracking
- Improved accuracy across different contract structures

## License

This project is licensed under the MIT License.