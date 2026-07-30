from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.document import SearchQuery, SearchResponse, SearchResultItem
from app.ai.embeddings import embed_query
from app.ai import vector_store
from app.services import activity_service

router = APIRouter(prefix="/search", tags=["Search"])


@router.post("", response_model=SearchResponse)
def semantic_search(
    payload: SearchQuery,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Converts the query to an embedding locally, then does a nearest-neighbour
    lookup in the FAISS index built from uploaded documents. No external
    LLM API is used for the retrieval itself.
    """
    query_vector = embed_query(payload.query)
    raw_results = vector_store.search(query_vector, top_k=payload.top_k)

    activity_service.log_activity(db, current_user.id, "search", payload.query)

    results = [
        SearchResultItem(
            document_id=r["document_id"],
            filename=r["filename"],
            chunk_text=r["chunk_text"],
            score=r["score"],
        )
        for r in raw_results
    ]
    return SearchResponse(query=payload.query, results=results)
