from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.auth import RegisterRequest, TokenResponse
from app.schemas.user import UserOut
from app.services import auth_service, activity_service
from app.security import create_access_token
from app.dependencies import get_current_user, require_role
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    try:
        user = auth_service.create_user(
            db, payload.username, payload.email, payload.password, payload.role
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    return UserOut(
        id=user.id, username=user.username, email=user.email,
        role=user.role_name, created_at=user.created_at,
    )


@router.post("/login", response_model=TokenResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = auth_service.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token({"sub": str(user.id), "role": user.role_name})
    activity_service.log_activity(db, user.id, "login", f"user {user.username} logged in")

    return TokenResponse(
        access_token=token, role=user.role_name, user_id=user.id, username=user.username
    )


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return UserOut(
        id=current_user.id, username=current_user.username, email=current_user.email,
        role=current_user.role_name, created_at=current_user.created_at,
    )


@router.get("/users", response_model=list[UserOut])
def list_users(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    """Admin-only: list all users, mainly used to populate the task-assignment dropdown."""
    users = db.query(User).order_by(User.username).all()
    return [
        UserOut(id=u.id, username=u.username, email=u.email, role=u.role_name, created_at=u.created_at)
        for u in users
    ]
