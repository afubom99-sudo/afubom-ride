from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.api.dependencies import get_current_user, require_roles
from backend.app.db.session import get_db
from backend.app.models import (
    Booking,
    BookingStatus,
    BookingStatusHistory,
    RiderProfile,
    User,
    UserRole,
)
from backend.app.schemas import (
    BookingCreateRequest,
    BookingResponse,
    FareEstimateRequest,
    FareResponse,
    StatusUpdateRequest,
)
from backend.app.services.fare_service import calculate_fare


router = APIRouter(prefix="/bookings", tags=["Bookings"])


ALLOWED_TRANSITIONS = {
    BookingStatus.REQUESTED: {BookingStatus.SEARCHING_FOR_RIDER, BookingStatus.CANCELLED},
    BookingStatus.SEARCHING_FOR_RIDER: {BookingStatus.RIDER_ASSIGNED, BookingStatus.CANCELLED},
    BookingStatus.RIDER_ASSIGNED: {BookingStatus.RIDER_ARRIVED, BookingStatus.CANCELLED, BookingStatus.REQUESTED},
    BookingStatus.RIDER_ARRIVED: {BookingStatus.IN_PROGRESS, BookingStatus.CANCELLED},
    BookingStatus.IN_PROGRESS: {BookingStatus.COMPLETED, BookingStatus.CANCELLED},
    BookingStatus.COMPLETED: set(),
    BookingStatus.CANCELLED: set(),
}


@router.post("/estimate", response_model=FareResponse)
def estimate(payload: FareEstimateRequest):
    return FareResponse(**calculate_fare(
        payload.booking_type,
        payload.pickup_latitude,
        payload.pickup_longitude,
        payload.destination_latitude,
        payload.destination_longitude,
    ))


@router.post("", response_model=BookingResponse, status_code=201)
def create_booking(
    payload: BookingCreateRequest,
    user: User = Depends(require_roles(UserRole.CUSTOMER)),
    db: Session = Depends(get_db),
):
    existing = db.scalar(select(Booking).where(
        Booking.customer_id == user.id,
        Booking.idempotency_key == payload.idempotency_key,
    ))
    if existing:
        return existing
    fare = calculate_fare(
        payload.booking_type,
        payload.pickup_latitude,
        payload.pickup_longitude,
        payload.destination_latitude,
        payload.destination_longitude,
    )
    booking = Booking(
        customer_id=user.id,
        booking_type=payload.booking_type,
        pickup_address=payload.pickup_address,
        destination_address=payload.destination_address,
        pickup_latitude=payload.pickup_latitude,
        pickup_longitude=payload.pickup_longitude,
        destination_latitude=payload.destination_latitude,
        destination_longitude=payload.destination_longitude,
        estimated_distance_km=fare["distance_km"],
        estimated_duration_minutes=fare["duration_minutes"],
        estimated_fare_xaf=fare["total"],
        status=BookingStatus.SEARCHING_FOR_RIDER,
        special_instructions=payload.special_instructions,
        idempotency_key=payload.idempotency_key,
    )
    db.add(booking)
    db.flush()
    db.add(BookingStatusHistory(
        booking_id=booking.id,
        previous_status=None,
        new_status=BookingStatus.SEARCHING_FOR_RIDER,
        changed_by=user.id,
    ))
    db.commit()
    db.refresh(booking)
    return booking


@router.get("", response_model=list[BookingResponse])
def list_bookings(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    statement = select(Booking)
    if user.role == UserRole.CUSTOMER:
        statement = statement.where(Booking.customer_id == user.id)
    elif user.role == UserRole.RIDER:
        profile = db.scalar(select(RiderProfile).where(RiderProfile.user_id == user.id))
        statement = statement.where(Booking.rider_id == profile.id if profile else False)
    statement = statement.order_by(Booking.created_at.desc()).limit(limit).offset(offset)
    return list(db.scalars(statement).all())


@router.get("/{booking_id}", response_model=BookingResponse)
def get_booking(
    booking_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = db.get(Booking, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if user.role == UserRole.CUSTOMER and booking.customer_id != user.id:
        raise HTTPException(status_code=403, detail="You cannot access this booking")
    if user.role == UserRole.RIDER:
        profile = db.scalar(select(RiderProfile).where(RiderProfile.user_id == user.id))
        if not profile or booking.rider_id != profile.id:
            raise HTTPException(status_code=403, detail="You cannot access this booking")
    return booking


@router.post("/{booking_id}/cancel", response_model=BookingResponse)
def cancel_booking(
    booking_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = db.get(Booking, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if user.role == UserRole.CUSTOMER and booking.customer_id != user.id:
        raise HTTPException(status_code=403, detail="You cannot cancel this booking")
    if booking.status in (BookingStatus.COMPLETED, BookingStatus.CANCELLED):
        raise HTTPException(status_code=409, detail="This booking cannot be cancelled")
    previous = booking.status
    booking.status = BookingStatus.CANCELLED
    booking.cancelled_at = datetime.now(timezone.utc)
    db.add(BookingStatusHistory(
        booking_id=booking.id,
        previous_status=previous,
        new_status=BookingStatus.CANCELLED,
        changed_by=user.id,
    ))
    db.commit()
    db.refresh(booking)
    return booking


@router.patch("/{booking_id}/status", response_model=BookingResponse)
def update_status(
    booking_id: str,
    payload: StatusUpdateRequest,
    user: User = Depends(require_roles(UserRole.RIDER, UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    booking = db.get(Booking, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if user.role == UserRole.RIDER:
        profile = db.scalar(select(RiderProfile).where(RiderProfile.user_id == user.id))
        if not profile or booking.rider_id != profile.id:
            raise HTTPException(status_code=403, detail="You cannot update this booking")
    if payload.status not in ALLOWED_TRANSITIONS[booking.status]:
        raise HTTPException(status_code=409, detail=f"Cannot change booking from {booking.status.value} to {payload.status.value}")
    if payload.status == BookingStatus.RIDER_ARRIVED and booking.status != BookingStatus.RIDER_ASSIGNED:
        raise HTTPException(status_code=409, detail="Rider must be assigned before arrival")
    previous = booking.status
    booking.status = payload.status
    if payload.status == BookingStatus.IN_PROGRESS:
        booking.started_at = datetime.now(timezone.utc)
    if payload.status == BookingStatus.COMPLETED:
        if booking.started_at is None:
            raise HTTPException(status_code=409, detail="Booking must start before completion")
        booking.completed_at = datetime.now(timezone.utc)
        booking.final_fare_xaf = booking.estimated_fare_xaf
    db.add(BookingStatusHistory(
        booking_id=booking.id,
        previous_status=previous,
        new_status=payload.status,
        changed_by=user.id,
        notes=payload.notes,
    ))
    db.commit()
    db.refresh(booking)
    return booking
