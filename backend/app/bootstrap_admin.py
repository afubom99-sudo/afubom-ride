import os

from sqlalchemy import select

from backend.app.core.security import hash_password
from backend.app.db.session import SessionLocal
from backend.app.models import AccountStatus, User, UserRole, VerificationStatus


def bootstrap_admin():
    phone = os.getenv("BOOTSTRAP_ADMIN_PHONE")
    password = os.getenv("BOOTSTRAP_ADMIN_PASSWORD")
    name = os.getenv("BOOTSTRAP_ADMIN_NAME", "Platform Administrator")
    if not phone or not password:
        raise RuntimeError("BOOTSTRAP_ADMIN_PHONE and BOOTSTRAP_ADMIN_PASSWORD are required")
    if len(password) < 12:
        raise RuntimeError("BOOTSTRAP_ADMIN_PASSWORD must contain at least 12 characters")
    db = SessionLocal()
    try:
        existing = db.scalar(select(User).where(User.phone == phone))
        if existing:
            if existing.role != UserRole.ADMIN:
                raise RuntimeError("The bootstrap phone belongs to a non-administrator account")
            print("Administrator already exists.")
            return
        admin = User(
            full_name=name,
            phone=phone,
            password_hash=hash_password(password),
            role=UserRole.ADMIN,
            account_status=AccountStatus.ACTIVE,
            verification_status=VerificationStatus.VERIFIED,
        )
        db.add(admin)
        db.commit()
        print("Administrator created.")
    finally:
        db.close()


if __name__ == "__main__":
    bootstrap_admin()
