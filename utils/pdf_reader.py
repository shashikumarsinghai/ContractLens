from pypdf import PdfReader


def extract_pdf_text(file_path):
    """
    Extract text from a PDF while preserving page boundaries.

    Returns:
        dict containing:
        - full_text: complete extracted text
        - pages: list of page dictionaries
    """

    reader = PdfReader(file_path)

    pages = []
    full_text_parts = []

    for page_number, page in enumerate(reader.pages, start=1):
        text = page.extract_text() or ""
        text = text.strip()

        page_data = {
            "page": page_number,
            "text": text
        }

        pages.append(page_data)

        if text:
            full_text_parts.append(
                f"--- Page {page_number} ---\n{text}"
            )

    full_text = "\n\n".join(full_text_parts)

    return {
        "full_text": full_text,
        "pages": pages
    }