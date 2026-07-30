"""
documents(id, filename, filepath, content_text, uploaded_by FK users, uploaded_at)

content_text holds the extracted plain text used to build embeddings.
"""
from datetime import datetime

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    filepath = Column(String(500), nullable=False)
    file_type = Column(String(10), nullable=False)  # 'pdf' | 'txt'
    content_text = Column(Text, nullable=True)

    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    uploader = relationship("User", back_populates="documents")

    uploaded_at = Column(DateTime, default=datetime.utcnow)

    # embedding chunk ids stored in the FAISS index for this document,
    # kept as a comma-separated string of integer ids (simple, no extra table needed)
    vector_ids = Column(Text, nullable=True)
