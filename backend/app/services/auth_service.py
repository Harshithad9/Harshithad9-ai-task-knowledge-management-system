from sqlalchemy.orm import Session

from app.models.user import User, Role
from app.security import hash_password, verify_password


def get_role(db: Session, role_name: str) -> Role:
    role = db.query(Role).filter(Role.name == role_name).first()
    if role is None:
        raise ValueError(f"Role '{role_name}' does not exist. Run the seed script first.")
    return role


def create_user(db: Session, username: str, email: str, password: str, role_name: str) -> User:
    if db.query(User).filter(User.username == username).first():
        raise ValueError("Username already taken")
    if db.query(User).filter(User.email == email).first():
        raise ValueError("Email already registered")

    role = get_role(db, role_name)
    user = User(
        username=username,
        email=email,
        password_hash=hash_password(password),
        role_id=role.id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, username: str, password: str) -> User | None:
    user = db.query(User).filter(User.username == username).first()
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user
