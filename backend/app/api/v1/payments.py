from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from api.dependencies import get_current_user
from db.session import get_db
from models import Booking, Payment, PaymentStatus, User
from services.payments import get_payment_provider


router = APIRouter(prefix="/payments", tags=["Payments"])


class PaymentInitiateRequest(BaseModel):
    booking_id: str
    method: str = Field(pattern=r"^(cash|mobile_money)$")


@router.post("/initiate")
def initiate_payment(
    payload: PaymentInitiateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = db.get(Booking, payload.booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.customer_id != user.id:
        raise HTTPException(status_code=403, detail="You cannot pay for this booking")
    existing = db.scalar(select(Payment).where(
        Payment.booking_id == booking.id,
        Payment.status.in_([PaymentStatus.PENDING, PaymentStatus.PAID]),
    ))
    if existing:
        return {
            "id": existing.id,
            "status": existing.status.value,
            "provider": existing.provider,
            "provider_reference": existing.provider_reference,
        }
    amount = booking.final_fare_xaf or booking.estimated_fare_xaf
    try:
        provider = get_payment_provider(payload.method)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    result = provider.initiate(amount, f"BD-{booking.id}")
    payment = Payment(
        booking_id=booking.id,
        customer_id=user.id,
        amount_xaf=amount,
        method=payload.method,
        provider=result["provider_reference"].split("-", 1)[0].lower() if payload.method == "cash" else "test_mobile_money",
        provider_reference=result["provider_reference"],
        status=PaymentStatus.PENDING,
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return {
        "id": payment.id,
        "status": payment.status.value,
        "provider": payment.provider,
        "provider_reference": payment.provider_reference,
        "message": result["message"],
    }


@router.get("/{payment_id}")
def payment_status(
    payment_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    payment = db.get(Payment, payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    if payment.customer_id != user.id:
        raise HTTPException(status_code=403, detail="You cannot view this payment")
    return {
        "id": payment.id,
        "booking_id": payment.booking_id,
        "amount_xaf": payment.amount_xaf,
        "currency": payment.currency,
        "method": payment.method,
        "status": payment.status.value,
    }


@router.post("/webhook/{provider}")
def payment_webhook(provider: str, db: Session = Depends(get_db)):
    raise HTTPException(
        status_code=501,
        detail=f"Live webhook integration for {provider} is not configured",
    )
