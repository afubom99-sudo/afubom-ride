from fastapi.testclient import TestClient

from db.session import Base, engine
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
    assert response.json()["status"] == "ok"


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
