from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.task import Task, TaskStatus
from app.models.document import Document
from app.models.user import User
from app.models.activity_log import ActivityLog


def get_analytics(db: Session, top_n_queries: int = 5) -> dict:
    total_tasks = db.query(func.count(Task.id)).scalar() or 0
    completed_tasks = (
        db.query(func.count(Task.id)).filter(Task.status == TaskStatus.COMPLETED).scalar() or 0
    )
    pending_tasks = (
        db.query(func.count(Task.id)).filter(Task.status == TaskStatus.PENDING).scalar() or 0
    )
    total_documents = db.query(func.count(Document.id)).scalar() or 0
    total_users = db.query(func.count(User.id)).scalar() or 0

    query_counts = (
        db.query(ActivityLog.details, func.count(ActivityLog.id).label("cnt"))
        .filter(ActivityLog.action == "search")
        .group_by(ActivityLog.details)
        .order_by(func.count(ActivityLog.id).desc())
        .limit(top_n_queries)
        .all()
    )

    return {
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "pending_tasks": pending_tasks,
        "total_documents": total_documents,
        "total_users": total_users,
        "most_searched_queries": [{"query": q or "", "count": c} for q, c in query_counts],
    }
