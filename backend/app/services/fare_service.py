from math import asin, cos, radians, sin, sqrt

from backend.app.models import BookingType


FARE_CONFIG = {
    BookingType.RIDE: {"base": 500, "per_km": 180, "minimum": 700},
    BookingType.DELIVERY: {"base": 500, "per_km": 220, "minimum": 800},
    BookingType.DOCUMENT: {"base": 500, "per_km": 200, "minimum": 700},
    BookingType.FOOD: {"base": 500, "per_km": 220, "minimum": 900},
    BookingType.GROCERY: {"base": 500, "per_km": 220, "minimum": 1000},
}


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius_km = 6371.0
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    return radius_km * 2 * asin(sqrt(a))


def calculate_fare(
    booking_type: BookingType,
    pickup_latitude: float,
    pickup_longitude: float,
    destination_latitude: float,
    destination_longitude: float,
) -> dict:
    distance = haversine_km(
        pickup_latitude,
        pickup_longitude,
        destination_latitude,
        destination_longitude,
    )
    distance = max(distance, 0.1)
    config = FARE_CONFIG[booking_type]
    distance_charge = round(distance * config["per_km"])
    total = max(config["base"] + distance_charge, config["minimum"])
    duration = max(5, round(distance * 3.5))
    return {
        "currency": "XAF",
        "distance_km": round(distance, 2),
        "duration_minutes": duration,
        "base_fare": config["base"],
        "distance_charge": distance_charge,
        "minimum_fare": config["minimum"],
        "total": total,
    }
