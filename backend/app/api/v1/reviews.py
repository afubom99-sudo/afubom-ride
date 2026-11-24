from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.api.dependencies import get_current_user
from backend.app.db.session import get_db
from backend.app.models import Booking, BookingStatus, Review, RiderProfile, User


router = APIRouter(prefix="/reviews", tags=["Reviews"])


class ReviewRequest(BaseModel):
    booking_id: str
    rating: int = Field(ge=1, le=5)
    comment: str | None = Field(default=None, max_length=1000)


@router.post("")
def create_review(
    payload: ReviewRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = db.get(Booking, payload.booking_id)
    if not booking or booking.customer_id != user.id:
        raise HTTPException(status_code=403, detail="Reviewable booking not found")
    if booking.status != BookingStatus.COMPLETED:
        raise HTTPException(status_code=409, detail="Only completed bookings can be reviewed")
    if not booking.rider_id:
        raise HTTPException(status_code=409, detail="No rider is assigned to this booking")
    existing = db.scalar(select(Review).where(Review.booking_id == booking.id))
    if existing:
        raise HTTPException(status_code=409, detail="Booking has already been reviewed")
    review = Review(
        booking_id=booking.id,
        customer_id=user.id,
        rider_id=booking.rider_id,
        rating=payload.rating,
        comment=payload.comment,
    )
    db.add(review)
    db.flush()
    profile = db.get(RiderProfile, booking.rider_id)
    if profile:
        ratings = db.scalars(select(Review.rating).where(Review.rider_id == profile.id)).all()
        profile.rating = round(sum(ratings) / len(ratings), 2)
    db.commit()
    return {"id": review.id, "booking_id": review.booking_id, "rating": review.rating}


@router.get("/riders/{rider_id}")
def rider_reviews(rider_id: str, db: Session = Depends(get_db)):
    reviews = db.scalars(select(Review).where(Review.rider_id == rider_id).order_by(Review.created_at.desc())).all()
    return [
        {
            "id": review.id,
            "rating": review.rating,
            "comment": review.comment,
            "created_at": review.created_at,
        }
        for review in reviews
    ]
