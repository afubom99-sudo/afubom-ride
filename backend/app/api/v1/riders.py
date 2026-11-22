from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from api.dependencies import require_roles
from db.session import get_db
from models import Booking, BookingStatus, RiderProfile, User, UserRole, VerificationStatus
from schemas import RiderApplyRequest, RiderAvailabilityRequest


router = APIRouter(prefix="/riders", tags=["Riders"])


@router.post("/apply")
def apply(
    payload: RiderApplyRequest,
    user: User = Depends(require_roles(UserRole.CUSTOMER, UserRole.RIDER)),
    db: Session = Depends(get_db),
):
    profile = db.scalar(select(RiderProfile).where(RiderProfile.user_id == user.id))
    if profile:
        raise HTTPException(status_code=409, detail="Rider application already exists")
    profile = RiderProfile(
        user_id=user.id,
        license_number=payload.license_number,
        motorcycle_make=payload.motorcycle_make,
        motorcycle_model=payload.motorcycle_model,
        registration_number=payload.registration_number,
        verification_status=VerificationStatus.PENDING,
    )
    user.role = UserRole.RIDER
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return {
        "id": profile.id,
        "verification_status": profile.verification_status.value,
        "is_online": profile.is_online,
    }


@router.get("/me")
def me(
    user: User = Depends(require_roles(UserRole.RIDER)),
    db: Session = Depends(get_db),
):
    profile = db.scalar(select(RiderProfile).where(RiderProfile.user_id == user.id))
    if not profile:
        raise HTTPException(status_code=404, detail="Rider profile not found")
    return {
        "id": profile.id,
        "user_id": profile.user_id,
        "license_number": profile.license_number,
        "motorcycle_make": profile.motorcycle_make,
        "motorcycle_model": profile.motorcycle_model,
        "registration_number": profile.registration_number,
        "verification_status": profile.verification_status.value,
        "is_online": profile.is_online,
        "rating": profile.rating,
    }


@router.post("/availability")
def availability(
    payload: RiderAvailabilityRequest,
    user: User = Depends(require_roles(UserRole.RIDER)),
    db: Session = Depends(get_db),
):
    profile = db.scalar(select(RiderProfile).where(RiderProfile.user_id == user.id))
    if not profile:
        raise HTTPException(status_code=404, detail="Rider profile not found")
    if payload.is_online and profile.verification_status != VerificationStatus.VERIFIED:
        raise HTTPException(status_code=409, detail="Rider application must be approved before going online")
    profile.is_online = payload.is_online
    db.commit()
    return {"is_online": profile.is_online}


@router.get("/requests")
def requests(
    user: User = Depends(require_roles(UserRole.RIDER)),
    db: Session = Depends(get_db),
):
    profile = db.scalar(select(RiderProfile).where(RiderProfile.user_id == user.id))
    if not profile or profile.verification_status != VerificationStatus.VERIFIED:
        raise HTTPException(status_code=403, detail="Approved rider account required")
    bookings = db.scalars(select(Booking).where(
        Booking.status.in_([BookingStatus.REQUESTED, BookingStatus.SEARCHING_FOR_RIDER])
    ).order_by(Booking.created_at.desc()).limit(20)).all()
    return [
        {
            "id": booking.id,
            "booking_type": booking.booking_type.value,
            "pickup_address": booking.pickup_address,
            "destination_address": booking.destination_address,
            "estimated_fare_xaf": booking.estimated_fare_xaf,
            "status": booking.status.value,
        }
        for booking in bookings
    ]


@router.post("/requests/{booking_id}/accept")
def accept(
    booking_id: str,
    user: User = Depends(require_roles(UserRole.RIDER)),
    db: Session = Depends(get_db),
):
    profile = db.scalar(select(RiderProfile).where(RiderProfile.user_id == user.id))
    if not profile or profile.verification_status != VerificationStatus.VERIFIED:
        raise HTTPException(status_code=403, detail="Approved rider account required")
    active = db.scalar(select(Booking).where(
        Booking.rider_id == profile.id,
        Booking.status.in_([
            BookingStatus.RIDER_ASSIGNED,
            BookingStatus.RIDER_ARRIVED,
            BookingStatus.IN_PROGRESS,
        ]),
    ))
    if active:
        raise HTTPException(status_code=409, detail="Rider already has an active booking")
    booking = db.get(Booking, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.status not in (BookingStatus.REQUESTED, BookingStatus.SEARCHING_FOR_RIDER):
        raise HTTPException(status_code=409, detail="Booking is no longer available")
    previous = booking.status
    booking.rider_id = profile.id
    booking.status = BookingStatus.RIDER_ASSIGNED
    booking.assigned_at = __import__("datetime").datetime.now(__import__("datetime").timezone.utc)
    db.commit()
    db.refresh(booking)
    return {"id": booking.id, "status": booking.status.value, "rider_id": booking.rider_id}
