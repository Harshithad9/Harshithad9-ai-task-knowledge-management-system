"""
Run once after the database exists and tables are created:

    python -m app.seed

Creates the 'admin' and 'user' roles, plus a default admin account so you
can log in immediately (credentials come from .env / config.py).
"""
from app.database import Base, engine, SessionLocal
from app import models  # noqa: F401
from app.models.user import Role, User
from app.security import hash_password
from app.config import settings


def run():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        for role_name in ("admin", "user"):
            if not db.query(Role).filter(Role.name == role_name).first():
                db.add(Role(name=role_name))
        db.commit()

        admin_role = db.query(Role).filter(Role.name == "admin").first()
        existing_admin = db.query(User).filter(User.username == settings.DEFAULT_ADMIN_USERNAME).first()
        if not existing_admin:
            admin = User(
                username=settings.DEFAULT_ADMIN_USERNAME,
                email=settings.DEFAULT_ADMIN_EMAIL,
                password_hash=hash_password(settings.DEFAULT_ADMIN_PASSWORD),
                role_id=admin_role.id,
            )
            db.add(admin)
            db.commit()
            print(f"Created default admin user: {settings.DEFAULT_ADMIN_USERNAME} / {settings.DEFAULT_ADMIN_PASSWORD}")
        else:
            print("Default admin already exists, skipping.")

        print("Seed complete: roles ['admin', 'user'] ready.")
    finally:
        db.close()


if __name__ == "__main__":
    run()
