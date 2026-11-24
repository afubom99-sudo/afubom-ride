from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..dependencies import require_roles
from backend.app.db.session import get_db
from backend.app.models import AccountStatus, Booking, RiderProfile, User, UserRole, VerificationStatus


router = APIRouter(prefix="/admin", tags=["Administration"])


@router.get("/dashboard")
def dashboard(
    admin: User = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    del admin
    return {
        "users": db.scalar(select(func.count()).select_from(User)) or 0,
        "riders": db.scalar(select(func.count()).select_from(RiderProfile)) or 0,
        "pending_rider_applications": db.scalar(select(func.count()).select_from(RiderProfile).where(
            RiderProfile.verification_status == VerificationStatus.PENDING
        )) or 0,
        "bookings": db.scalar(select(func.count()).select_from(Booking)) or 0,
    }


@router.get("/users")
def users(
    admin: User = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    del admin
    return [
        {
            "id": user.id,
            "full_name": user.full_name,
            "phone": user.phone,
            "role": user.role.value,
            "account_status": user.account_status.value,
        }
        for user in db.scalars(select(User).order_by(User.created_at.desc()).limit(100)).all()
    ]


@router.get("/riders")
def riders(
    admin: User = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    del admin
    profiles = db.scalars(select(RiderProfile).order_by(RiderProfile.created_at.desc()).limit(100)).all()
    return [
        {
            "id": profile.id,
            "user_id": profile.user_id,
            "motorcycle_make": profile.motorcycle_make,
            "motorcycle_model": profile.motorcycle_model,
            "registration_number": profile.registration_number,
            "verification_status": profile.verification_status.value,
            "is_online": profile.is_online,
        }
        for profile in profiles
    ]


@router.post("/riders/{rider_id}/approve")
def approve_rider(
    rider_id: str,
    admin: User = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    del admin
    profile = db.get(RiderProfile, rider_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Rider profile not found")
    profile.verification_status = VerificationStatus.VERIFIED
    db.commit()
    return {"id": profile.id, "verification_status": profile.verification_status.value}


@router.post("/riders/{rider_id}/reject")
def reject_rider(
    rider_id: str,
    admin: User = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    del admin
    profile = db.get(RiderProfile, rider_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Rider profile not found")
    profile.verification_status = VerificationStatus.REJECTED
    profile.is_online = False
    db.commit()
    return {"id": profile.id, "verification_status": profile.verification_status.value}


@router.post("/users/{user_id}/suspend")
def suspend_user(
    user_id: str,
    admin: User = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    del admin
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role == UserRole.ADMIN:
        raise HTTPException(status_code=409, detail="Administrator accounts cannot be suspended from this endpoint")
    user.account_status = AccountStatus.SUSPENDED
    db.commit()
    return {"id": user.id, "account_status": user.account_status.value}
