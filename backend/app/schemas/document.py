from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class DocumentOut(BaseModel):
    id: int
    filename: str
    file_type: str
    uploaded_by: int
    uploaded_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SearchQuery(BaseModel):
    query: str
    top_k: int = 5


class SearchResultItem(BaseModel):
    document_id: int
    filename: str
    chunk_text: str
    score: float


class SearchResponse(BaseModel):
    query: str
    results: list[SearchResultItem]
