from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, require_role
from app.models.user import User
from app.schemas.document import DocumentOut
from app.services import document_service, activity_service

router = APIRouter(prefix="/documents", tags=["Documents"])


@router.post("", response_model=DocumentOut, status_code=status.HTTP_201_CREATED)
def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin: User = Depends(require_role("admin")),
):
    """Admin only: upload a .txt/.pdf document. Text is extracted and embedded automatically."""
    try:
        document = document_service.save_document(db, file, admin.id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    activity_service.log_activity(
        db, admin.id, "document_upload", f"uploaded {document.filename}"
    )
    return document


@router.get("", response_model=list[DocumentOut])
def list_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Any authenticated user can browse the knowledge base metadata."""
    return document_service.list_documents(db)
