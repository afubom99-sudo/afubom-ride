from sqlalchemy.orm import Session

from app.models import Notification


def create_notification(
    db: Session,
    user_id: str,
    notification_type: str,
    title: str,
    message: str,
) -> Notification:
    notification = Notification(
        user_id=user_id,
        notification_type=notification_type,
        title=title,
        message=message,
    )
    db.add(notification)
    db.flush()
    return notification
