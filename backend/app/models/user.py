"""
users and roles tables.

roles(id, name)                -> lookup table: 'admin' / 'user'
users(id, ..., role_id FK)      -> each user belongs to exactly one role
"""
from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(20), unique=True, nullable=False)  # 'admin' | 'user'

    users = relationship("User", back_populates="role")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(120), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)

    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    role = relationship("Role", back_populates="users")

    created_at = Column(DateTime, default=datetime.utcnow)

    # Tasks assigned to this user
    assigned_tasks = relationship(
        "Task", back_populates="assignee", foreign_keys="Task.assigned_to"
    )
    # Tasks this user created (relevant when the creator is an admin)
    created_tasks = relationship(
        "Task", back_populates="creator", foreign_keys="Task.created_by"
    )
    documents = relationship("Document", back_populates="uploader")
    activity_logs = relationship("ActivityLog", back_populates="user")

    @property
    def role_name(self) -> str:
        return self.role.name if self.role else ""
