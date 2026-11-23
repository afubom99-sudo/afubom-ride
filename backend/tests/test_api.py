import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError
from sqlalchemy.exc import OperationalError
from sqlalchemy.pool import NullPool

import app.main as main_module
from core.config import Settings
from db.session import Base, create_database_engine, engine
from app.main import app


client = TestClient(app)


def setup_function():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def register(phone: str, password: str = "StrongPassword123!", name: str = "Test User"):
    response = client.post("/api/v1/auth/register", json={
        "full_name": name,
        "phone": phone,
        "password": password,
    })
    assert response.status_code == 201, response.text
    return response.json()


def login(phone: str, password: str = "StrongPassword123!"):
    response = client.post("/api/v1/auth/login", json={
        "phone": phone,
        "password": password,
    })
    assert response.status_code == 200, response.text
    return response.json()


def auth_headers(tokens):
    return {"Authorization": f"Bearer {tokens['access_token']}"}


def test_health():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy", "database": "connected"}


def test_health_hides_database_errors(monkeypatch):
    def fail_connect():
        raise OperationalError("SELECT 1", {}, Exception("private database details"))

    monkeypatch.setattr(main_module.engine, "connect", fail_connect)
    response = client.get("/api/v1/health")
    assert response.status_code == 503
    assert response.json() == {"status": "unhealthy", "database": "unavailable"}
    assert "private database details" not in response.text


def test_development_settings_keep_sqlite_and_generate_a_secret(monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.delenv("JWT_SECRET", raising=False)
    settings = Settings(_env_file=None, app_env="development")
    assert settings.database_url_value.startswith("sqlite:")
    assert len(settings.jwt_secret_value) >= 32


def test_production_settings_require_database_url(monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.delenv("JWT_SECRET", raising=False)
    monkeypatch.delenv("VERCEL_ENV", raising=False)
    with pytest.raises(ValidationError, match="DATABASE_URL is required"):
        Settings(_env_file=None, app_env="production", jwt_secret="x" * 32)


def test_production_settings_require_strong_jwt_secret(monkeypatch):
    monkeypatch.delenv("JWT_SECRET", raising=False)
    monkeypatch.delenv("VERCEL_ENV", raising=False)
    with pytest.raises(ValidationError, match="JWT_SECRET is required"):
        Settings(
            _env_file=None,
            app_env="production",
            database_url="postgresql://user:password@db.example:5432/afubom",
        )


def test_vercel_production_requires_production_app_env(monkeypatch):
    monkeypatch.delenv("APP_ENV", raising=False)
    monkeypatch.setenv("VERCEL_ENV", "production")
    with pytest.raises(ValidationError, match="APP_ENV=production is required"):
        Settings(_env_file=None)


def test_postgresql_url_uses_psycopg_driver_and_hides_secrets():
    settings = Settings(
        _env_file=None,
        app_env="production",
        database_url="postgresql://user:password@db.example:5432/afubom",
        jwt_secret="x" * 32,
    )
    assert settings.database_url_value.startswith("postgresql+psycopg://")
    assert "password" not in repr(settings)
    assert "x" * 32 not in repr(settings)


def test_production_rejects_sqlite():
    with pytest.raises(ValidationError, match="must use PostgreSQL"):
        Settings(
            _env_file=None,
            app_env="production",
            database_url="sqlite:///./local.db",
            jwt_secret="x" * 32,
        )


def test_serverless_engine_uses_null_pool():
    test_engine = create_database_engine(
        "postgresql+psycopg://user:password@db.example:5432/afubom",
        serverless=True,
    )
    try:
        assert isinstance(test_engine.pool, NullPool)
    finally:
        test_engine.dispose()


def test_registration_login_and_object_authorization():
    customer = register("+237600000001")
    other = register("+237600000002")
    tokens = login("+237600000001")

    me = client.get("/api/v1/auth/me", headers=auth_headers(tokens))
    assert me.status_code == 200
    assert me.json()["id"] == customer["id"]

    estimate = client.post("/api/v1/bookings/estimate", json={
        "booking_type": "ride",
        "pickup_latitude": 5.9597,
        "pickup_longitude": 10.146,
        "destination_latitude": 5.9631,
        "destination_longitude": 10.158,
    })
    assert estimate.status_code == 200
    assert estimate.json()["currency"] == "XAF"
    assert estimate.json()["total"] >= estimate.json()["minimum_fare"]


def test_booking_creation_is_idempotent_and_owner_only():
    customer = register("+237600000003")
    other = register("+237600000004")
    tokens = login("+237600000003")
    other_tokens = login("+237600000004")
    payload = {
        "booking_type": "delivery",
        "pickup_address": "Commercial Avenue",
        "destination_address": "Food Market",
        "pickup_latitude": 5.9597,
        "pickup_longitude": 10.146,
        "destination_latitude": 5.9631,
        "destination_longitude": 10.158,
        "idempotency_key": "booking-test-key-001",
    }
    first = client.post("/api/v1/bookings", headers=auth_headers(tokens), json=payload)
    assert first.status_code == 201
    second = client.post("/api/v1/bookings", headers=auth_headers(tokens), json=payload)
    assert second.status_code == 201
    assert first.json()["id"] == second.json()["id"]

    forbidden = client.get(
        f"/api/v1/bookings/{first.json()['id']}",
        headers=auth_headers(other_tokens),
    )
    assert forbidden.status_code == 403


def test_rider_application_and_admin_approval():
    customer = register("+237600000005")
    rider_tokens = login("+237600000005")
    application = client.post("/api/v1/riders/apply", headers=auth_headers(rider_tokens), json={
        "license_number": "LIC-123456",
        "motorcycle_make": "Test Motorcycle",
        "motorcycle_model": "MVP",
        "registration_number": "REG-123456",
    })
    assert application.status_code == 200

    # Administrative promotion is deployment/bootstrap responsibility.


def test_cash_payment_is_created_without_fake_success():
    register("+237600000007")
    tokens = login("+237600000007")
    booking = client.post("/api/v1/bookings", headers=auth_headers(tokens), json={
        "booking_type": "ride",
        "pickup_address": "Commercial Avenue",
        "destination_address": "Bamenda",
        "pickup_latitude": 5.9597,
        "pickup_longitude": 10.146,
        "destination_latitude": 5.9631,
        "destination_longitude": 10.158,
        "idempotency_key": "booking-cash-test-001",
    })
    payment = client.post("/api/v1/payments/initiate", headers=auth_headers(tokens), json={
        "booking_id": booking.json()["id"],
        "method": "cash",
    })
    assert payment.status_code == 200
    assert payment.json()["status"] == "pending"
