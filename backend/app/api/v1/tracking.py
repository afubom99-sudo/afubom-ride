from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from api.dependencies import get_current_user, require_roles
from core.config import get_settings
from core.security import decode_token
from db.session import SessionLocal, get_db
from models import Booking, BookingStatus, RiderLocation, RiderProfile, User, UserRole
from schemas import LocationRequest


router = APIRouter(prefix="/tracking", tags=["Tracking"])


@router.websocket("/ws/{booking_id}")
async def booking_tracking_socket(websocket: WebSocket, booking_id: str):
    token = websocket.query_params.get("access_token")
    if not token:
        await websocket.close(code=1008)
        return
    try:
        payload = decode_token(token)
    except ValueError:
        await websocket.close(code=1008)
        return
    if payload.get("type") != "access":
        await websocket.close(code=1008)
        return
    db = SessionLocal()
    try:
        user = db.get(User, payload["sub"])
        booking = db.get(Booking, booking_id)
        if not user or not booking:
            await websocket.close(code=1008)
            return
        if user.role == UserRole.CUSTOMER and booking.customer_id != user.id:
            await websocket.close(code=1008)
            return
        if user.role == UserRole.RIDER:
            profile = db.scalar(select(RiderProfile).where(RiderProfile.user_id == user.id))
            if not profile or booking.rider_id != profile.id:
                await websocket.close(code=1008)
                return
        await websocket.accept()
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        return
    finally:
        db.close()



@router.post("/location")
def publish_location(
    payload: LocationRequest,
    user: User = Depends(require_roles(UserRole.RIDER)),
    db: Session = Depends(get_db),
):
    profile = db.scalar(select(RiderProfile).where(RiderProfile.user_id == user.id))
    if not profile or not profile.is_online:
        raise HTTPException(status_code=403, detail="Rider must be online")
    if payload.booking_id:
        booking = db.get(Booking, payload.booking_id)
        if not booking or booking.rider_id != profile.id:
            raise HTTPException(status_code=403, detail="This is not an authorized active booking")
        if booking.status not in (
            BookingStatus.RIDER_ASSIGNED,
            BookingStatus.RIDER_ARRIVED,
            BookingStatus.IN_PROGRESS,
        ):
            raise HTTPException(status_code=409, detail="Location sharing requires an active booking")
    location = RiderLocation(
        rider_id=profile.id,
        booking_id=payload.booking_id,
        latitude=payload.latitude,
        longitude=payload.longitude,
        accuracy_meters=payload.accuracy_meters,
    )
    db.add(location)
    retention = datetime.now(timezone.utc) - timedelta(
        days=get_settings().location_retention_days
    )
    db.execute(delete(RiderLocation).where(RiderLocation.created_at < retention))
    db.commit()
    return {"status": "recorded"}


@router.get("/bookings/{booking_id}")
def get_tracking(
    booking_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = db.get(Booking, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if user.role == UserRole.CUSTOMER and booking.customer_id != user.id:
        raise HTTPException(status_code=403, detail="You cannot track this booking")
    if user.role == UserRole.RIDER:
        profile = db.scalar(select(RiderProfile).where(RiderProfile.user_id == user.id))
        if not profile or booking.rider_id != profile.id:
            raise HTTPException(status_code=403, detail="You cannot track this booking")
    if not booking.rider_id:
        return {"booking_status": booking.status.value, "location": None}
    location = db.scalar(select(RiderLocation).where(
        RiderLocation.booking_id == booking.id
    ).order_by(RiderLocation.created_at.desc()))
    return {
        "booking_status": booking.status.value,
        "location": None if not location else {
            "latitude": location.latitude,
            "longitude": location.longitude,
            "accuracy_meters": location.accuracy_meters,
            "timestamp": location.created_at.isoformat(),
        },
    }
