from abc import ABC, abstractmethod
from datetime import datetime, timezone
from uuid import uuid4


class PaymentProvider(ABC):
    @abstractmethod
    def initiate(self, amount_xaf: int, reference: str) -> dict:
        pass

    @abstractmethod
    def verify_callback(self, payload: dict, signature: str | None) -> bool:
        pass


class TestMobileMoneyProvider(PaymentProvider):
    def initiate(self, amount_xaf: int, reference: str) -> dict:
        return {
            "mode": "test",
            "status": "pending",
            "provider_reference": f"TEST-MM-{uuid4()}",
            "message": "Test mode: no real payment was initiated.",
        }

    def verify_callback(self, payload: dict, signature: str | None) -> bool:
        return payload.get("mode") == "test"


class CashProvider(PaymentProvider):
    def initiate(self, amount_xaf: int, reference: str) -> dict:
        return {
            "mode": "cash",
            "status": "pending",
            "provider_reference": reference,
            "message": "Pay the rider or delivery operator on completion.",
        }

    def verify_callback(self, payload: dict, signature: str | None) -> bool:
        return payload.get("provider_reference") is not None


def get_payment_provider(method: str) -> PaymentProvider:
    if method == "cash":
        return CashProvider()
    if method == "mobile_money":
        return TestMobileMoneyProvider()
    raise ValueError("Unsupported payment method")
