from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, require_role
from app.models.user import User
from app.models.task import TaskStatus
from app.schemas.task import TaskCreate, TaskOut, TaskStatusUpdate
from app.services import task_service, activity_service

router = APIRouter(prefix="/tasks", tags=["Tasks"])


@router.post("", response_model=TaskOut, status_code=status.HTTP_201_CREATED)
def create_task(
    payload: TaskCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role("admin")),
):
    """Admin only: create and assign a task."""
    try:
        task = task_service.create_task(
            db, payload.title, payload.description, payload.assigned_to, admin.id
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    return task


@router.get("", response_model=list[TaskOut])
def list_tasks(
    status_filter: Optional[TaskStatus] = None,
    assigned_to: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Dynamic filtering API:
      /tasks                       -> tasks visible to caller
      /tasks?status=completed
      /tasks?assigned_to=1         -> admin only, non-admins are auto-scoped to themselves
    """
    return task_service.get_tasks(
        db, status=status_filter, assigned_to=assigned_to, requesting_user=current_user
    )


@router.patch("/{task_id}/status", response_model=TaskOut)
def update_status(
    task_id: int,
    payload: TaskStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """User (or admin): update a task's status, e.g. Pending -> Completed."""
    task = task_service.get_task(db, task_id)
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    if current_user.role_name != "admin" and task.assigned_to != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update tasks assigned to you",
        )

    task = task_service.update_task_status(db, task, payload.status)
    activity_service.log_activity(
        db, current_user.id, "task_update", f"task {task.id} -> {payload.status.value}"
    )
    return task
