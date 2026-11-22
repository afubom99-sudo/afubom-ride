from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from api.dependencies import get_current_user, require_roles
from db.session import get_db
from models import Booking, Complaint, ComplaintStatus, User, UserRole


router = APIRouter(prefix="/complaints", tags=["Complaints"])


class ComplaintRequest(BaseModel):
    booking_id: str | None = None
    category: str = Field(min_length=2, max_length=60)
    description: str = Field(min_length=10, max_length=3000)


@router.post("")
def submit_complaint(
    payload: ComplaintRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rider_id = None
    if payload.booking_id:
        booking = db.get(Booking, payload.booking_id)
        if not booking or booking.customer_id != user.id:
            raise HTTPException(status_code=403, detail="Complaint booking not found")
        rider_id = booking.rider_id
    complaint = Complaint(
        booking_id=payload.booking_id,
        customer_id=user.id,
        rider_id=rider_id,
        category=payload.category,
        description=payload.description,
    )
    db.add(complaint)
    db.commit()
    db.refresh(complaint)
    return {"id": complaint.id, "status": complaint.status.value}


@router.get("/mine")
def my_complaints(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    complaints = db.scalars(select(Complaint).where(
        Complaint.customer_id == user.id
    ).order_by(Complaint.created_at.desc())).all()
    return [
        {"id": complaint.id, "category": complaint.category, "status": complaint.status.value}
        for complaint in complaints
    ]


@router.get("/admin")
def admin_complaints(
    admin: User = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    del admin
    complaints = db.scalars(select(Complaint).order_by(Complaint.created_at.desc())).all()
    return [
        {
            "id": complaint.id,
            "category": complaint.category,
            "description": complaint.description,
            "status": complaint.status.value,
            "admin_response": complaint.admin_response,
        }
        for complaint in complaints
    ]
