from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_role
from app.models.user import User
from app.schemas.analytics import AnalyticsResponse
from app.services import analytics_service

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("", response_model=AnalyticsResponse)
def get_analytics(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    """Admin-only dashboard: total tasks, completed vs pending, most searched queries."""
    return analytics_service.get_analytics(db)
