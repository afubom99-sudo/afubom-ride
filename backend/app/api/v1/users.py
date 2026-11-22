from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from api.dependencies import get_current_user
from db.session import get_db
from models import User
from schemas import UserResponse, UserUpdate


router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
def get_profile(user: User = Depends(get_current_user)):
    return user


@router.patch("/me", response_model=UserResponse)
def update_profile(
    payload: UserUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.full_name is not None:
        user.full_name = payload.full_name
    if payload.email is not None:
        user.email = payload.email
    db.commit()
    db.refresh(user)
    return user
