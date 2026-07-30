"""
Extracts plain text from uploaded .txt / .pdf files and splits it into
overlapping chunks suitable for embedding.
"""
from pypdf import PdfReader


def extract_text(filepath: str, file_type: str) -> str:
    if file_type == "txt":
        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()

    if file_type == "pdf":
        reader = PdfReader(filepath)
        pages_text = []
        for page in reader.pages:
            text = page.extract_text() or ""
            pages_text.append(text)
        return "\n".join(pages_text)

    raise ValueError(f"Unsupported file type: {file_type}")


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
    """
    Splits text into word-based overlapping chunks. Overlap keeps context
    from being cut off at chunk boundaries, which improves retrieval quality.
    """
    words = text.split()
    if not words:
        return []

    chunks = []
    start = 0
    while start < len(words):
        end = start + chunk_size
        chunk = " ".join(words[start:end])
        if chunk.strip():
            chunks.append(chunk)
        start += chunk_size - overlap
        if chunk_size <= overlap:  # safety guard against infinite loop
            break
    return chunks
