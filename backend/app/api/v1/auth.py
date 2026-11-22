from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from api.dependencies import get_current_user
from core.config import get_settings
from core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from db.session import get_db
from models import RefreshToken, User
from schemas import LoginRequest, RefreshRequest, RegisterRequest, TokenResponse, UserResponse


router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    if db.scalar(select(User).where(User.phone == payload.phone)):
        raise HTTPException(status_code=409, detail="A user with this phone number already exists")
    if payload.email and db.scalar(select(User).where(User.email == payload.email)):
        raise HTTPException(status_code=409, detail="A user with this email already exists")
    user = User(
        full_name=payload.full_name,
        phone=payload.phone,
        email=str(payload.email) if payload.email else None,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.phone == payload.phone))
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect phone number or password")
    settings = get_settings()
    access = create_access_token(user.id, user.role.value)
    refresh = create_refresh_token(user.id)
    db.add(RefreshToken(
        user_id=user.id,
        token=refresh,
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_days),
    ))
    db.commit()
    return TokenResponse(access_token=access, refresh_token=refresh)


@router.post("/refresh", response_model=TokenResponse)
def refresh(payload: RefreshRequest, db: Session = Depends(get_db)):
    try:
        token_payload = decode_token(payload.refresh_token)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token") from exc
    if token_payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    stored = db.scalar(select(RefreshToken).where(
        RefreshToken.token == payload.refresh_token,
        RefreshToken.revoked.is_(False),
    ))
    if not stored:
        raise HTTPException(status_code=401, detail="Refresh token is revoked or unknown")
    user = db.get(User, token_payload["sub"])
    if not user:
        raise HTTPException(status_code=401, detail="User no longer exists")
    stored.revoked = True
    access = create_access_token(user.id, user.role.value)
    refresh_token = create_refresh_token(user.id)
    settings = get_settings()
    db.add(RefreshToken(
        user_id=user.id,
        token=refresh_token,
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_days),
    ))
    db.commit()
    return TokenResponse(access_token=access, refresh_token=refresh_token)


@router.post("/logout", status_code=204)
def logout(payload: RefreshRequest, db: Session = Depends(get_db)):
    stored = db.scalar(select(RefreshToken).where(RefreshToken.token == payload.refresh_token))
    if stored:
        stored.revoked = True
        db.commit()
    return None


@router.get("/me", response_model=UserResponse)
def me(user: User = Depends(get_current_user)):
    return user
