import logging
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from api.v1 import admin, auth, bookings, complaints, notifications, payments, reviews, riders, tracking, users
from core.config import get_settings
from db.session import Base, engine
from models import (
    Booking,
    BookingStatusHistory,
    Payment,
    RefreshToken,
    RiderLocation,
    RiderProfile,
    User,
)


settings = get_settings()
logger = logging.getLogger(__name__)
app = FastAPI(
    title="Afubom ride",
    version="0.1.0",
    description="Backend API for motorcycle transport and local delivery operations.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Idempotency-Key"],
)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(self)"
    if settings.app_env == "production":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


@app.exception_handler(Exception)
async def safe_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "An unexpected server error occurred",
            }
        },
    )


if settings.app_env != "production":
    Base.metadata.create_all(bind=engine)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(riders.router, prefix="/api/v1")
app.include_router(bookings.router, prefix="/api/v1")
app.include_router(tracking.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")
app.include_router(payments.router, prefix="/api/v1")
app.include_router(reviews.router, prefix="/api/v1")
app.include_router(complaints.router, prefix="/api/v1")
app.include_router(notifications.router, prefix="/api/v1")


@app.get("/api/v1/health")
def health():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except SQLAlchemyError as exc:
        logger.error("Database health check failed (%s)", type(exc).__name__)
        return JSONResponse(
            status_code=503,
            content={"status": "unhealthy", "database": "unavailable"},
        )
    return {"status": "healthy", "database": "connected"}


@app.get("/api/v1/public/config")
def public_config():
    return {
        "google_maps_browser_key": settings.google_maps_browser_key or None,
    }


frontend_directory = Path(__file__).resolve().parents[2] / "frontend"
if not frontend_directory.exists():
    frontend_directory = Path("/app/frontend")
app.mount("/", StaticFiles(directory=str(frontend_directory), html=True), name="frontend")
