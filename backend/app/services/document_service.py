import os
import uuid

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.config import settings
from app.models.document import Document
from app.ai.text_extraction import extract_text, chunk_text
from app.ai.embeddings import embed_texts
from app.ai import vector_store

ALLOWED_EXTENSIONS = {"txt", "pdf"}


def _save_upload_to_disk(file: UploadFile, file_type: str) -> str:
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    unique_name = f"{uuid.uuid4().hex}.{file_type}"
    dest_path = os.path.join(settings.UPLOAD_DIR, unique_name)
    with open(dest_path, "wb") as out:
        out.write(file.file.read())
    return dest_path


def save_document(db: Session, file: UploadFile, uploaded_by: int) -> Document:
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError("Only .txt and .pdf files are supported")

    filepath = _save_upload_to_disk(file, ext)
    content_text = extract_text(filepath, ext)

    document = Document(
        filename=file.filename,
        filepath=filepath,
        file_type=ext,
        content_text=content_text,
        uploaded_by=uploaded_by,
    )
    db.add(document)
    db.commit()
    db.refresh(document)

    # Build embeddings and index them for semantic search
    chunks = chunk_text(content_text)
    if chunks:
        vectors = embed_texts(chunks)
        vector_ids = vector_store.add_chunks(document.id, document.filename, chunks, vectors)
        document.vector_ids = ",".join(str(v) for v in vector_ids)
        db.commit()
        db.refresh(document)

    return document


def list_documents(db: Session) -> list[Document]:
    return db.query(Document).order_by(Document.uploaded_at.desc()).all()
