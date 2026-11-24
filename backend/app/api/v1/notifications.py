from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.api.dependencies import get_current_user
from backend.app.db.session import get_db
from backend.app.models import Notification, User


router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("")
def notifications(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    items = db.scalars(select(Notification).where(
        Notification.user_id == user.id
    ).order_by(Notification.created_at.desc()).limit(50)).all()
    return [
        {
            "id": item.id,
            "type": item.notification_type,
            "title": item.title,
            "message": item.message,
            "read": item.read,
            "created_at": item.created_at,
        }
        for item in items
    ]
