from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from backend.app.models import BookingStatus, BookingType, PaymentStatus, VerificationStatus


class RegisterRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    phone: str = Field(min_length=9, max_length=24, pattern=r"^\+?[0-9]{9,15}$")
    email: EmailStr | None = None
    password: str = Field(min_length=12, max_length=128)


class LoginRequest(BaseModel):
    phone: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class UserResponse(BaseModel):
    id: str
    full_name: str
    phone: str
    email: str | None
    role: str
    account_status: str
    verification_status: str

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=120)
    email: EmailStr | None = None


class RiderApplyRequest(BaseModel):
    license_number: str = Field(min_length=3, max_length=60)
    motorcycle_make: str = Field(min_length=2, max_length=60)
    motorcycle_model: str = Field(min_length=1, max_length=60)
    registration_number: str = Field(min_length=3, max_length=60)


class RiderAvailabilityRequest(BaseModel):
    is_online: bool


class FareEstimateRequest(BaseModel):
    booking_type: BookingType
    pickup_latitude: float = Field(ge=-90, le=90)
    pickup_longitude: float = Field(ge=-180, le=180)
    destination_latitude: float = Field(ge=-90, le=90)
    destination_longitude: float = Field(ge=-180, le=180)


class FareResponse(BaseModel):
    currency: str = "XAF"
    distance_km: float
    duration_minutes: int
    base_fare: int
    distance_charge: int
    minimum_fare: int
    total: int


class BookingCreateRequest(FareEstimateRequest):
    pickup_address: str = Field(min_length=3, max_length=255)
    destination_address: str = Field(min_length=3, max_length=255)
    special_instructions: str | None = Field(default=None, max_length=1000)
    idempotency_key: str = Field(min_length=8, max_length=80)


class BookingResponse(BaseModel):
    id: str
    booking_type: str
    pickup_address: str
    destination_address: str
    pickup_latitude: float
    pickup_longitude: float
    destination_latitude: float
    destination_longitude: float
    estimated_distance_km: float
    estimated_duration_minutes: int
    estimated_fare_xaf: int
    final_fare_xaf: int | None
    status: str
    payment_status: str
    rider_id: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class StatusUpdateRequest(BaseModel):
    status: BookingStatus
    notes: str | None = Field(default=None, max_length=1000)


class LocationRequest(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    accuracy_meters: float | None = Field(default=None, ge=0)
    booking_id: str | None = None

