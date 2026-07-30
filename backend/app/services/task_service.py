from typing import Optional

from sqlalchemy.orm import Session

from app.models.task import Task, TaskStatus
from app.models.user import User


def create_task(db: Session, title: str, description: Optional[str], assigned_to: int, created_by: int) -> Task:
    assignee = db.query(User).filter(User.id == assigned_to).first()
    if assignee is None:
        raise ValueError("assigned_to user does not exist")

    task = Task(
        title=title,
        description=description,
        assigned_to=assigned_to,
        created_by=created_by,
        status=TaskStatus.PENDING,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def get_tasks(
    db: Session,
    status: Optional[TaskStatus] = None,
    assigned_to: Optional[int] = None,
    requesting_user: Optional[User] = None,
) -> list[Task]:
    """
    Dynamic filtering API: /tasks?status=completed / /tasks?assigned_to=1

    Non-admin users only ever see tasks assigned to them, regardless of the
    assigned_to filter they pass in (RBAC enforced at the data layer too).
    """
    query = db.query(Task)

    if requesting_user is not None and requesting_user.role_name != "admin":
        query = query.filter(Task.assigned_to == requesting_user.id)
    elif assigned_to is not None:
        query = query.filter(Task.assigned_to == assigned_to)

    if status is not None:
        query = query.filter(Task.status == status)

    return query.order_by(Task.created_at.desc()).all()


def get_task(db: Session, task_id: int) -> Optional[Task]:
    return db.query(Task).filter(Task.id == task_id).first()


def update_task_status(db: Session, task: Task, new_status: TaskStatus) -> Task:
    task.status = new_status
    db.commit()
    db.refresh(task)
    return task
