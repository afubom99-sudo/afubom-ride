import os
import secrets
from functools import lru_cache
from pathlib import Path

from pydantic import SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine import make_url
from sqlalchemy.exc import ArgumentError


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[2] / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_env: str = "development"
    database_url: SecretStr | None = None
    jwt_secret: SecretStr | None = None
    jwt_algorithm: str = "HS256"
    access_token_minutes: int = 30
    refresh_token_days: int = 14
    allowed_origins: str | None = None
    location_retention_days: int = 7
    google_maps_browser_key: str = ""

    @model_validator(mode="after")
    def validate_runtime_settings(self):
        if self.app_env not in {"development", "test", "production"}:
            raise ValueError("APP_ENV must be development, test, or production")

        if os.getenv("VERCEL_ENV") == "production":
            self.app_env = "production"

        is_production = self.app_env == "production"
        database_url = self.database_url.get_secret_value() if self.database_url else ""
        if not database_url:
            if not is_production:
                database_url = "sqlite:///./bamenda_bikes.db"
                self.database_url = SecretStr(database_url)
        elif database_url:
            try:
                parsed_database_url = make_url(database_url)
            except ArgumentError as exc:
                raise ValueError("DATABASE_URL must be a valid SQLAlchemy URL") from exc

            if is_production and parsed_database_url.drivername not in {
                "postgres",
                "postgresql",
                "postgresql+psycopg",
            }:
                raise ValueError("DATABASE_URL must use PostgreSQL when APP_ENV=production")
            if is_production and (not parsed_database_url.host or not parsed_database_url.database):
                raise ValueError("DATABASE_URL must include a PostgreSQL host and database name")

            if parsed_database_url.drivername in {"postgres", "postgresql"}:
                parsed_database_url = parsed_database_url.set(drivername="postgresql+psycopg")
            self.database_url = SecretStr(parsed_database_url.render_as_string(hide_password=False))

        jwt_secret = self.jwt_secret.get_secret_value() if self.jwt_secret else ""
        if not jwt_secret:
            if not is_production:
                jwt_secret = secrets.token_urlsafe(32)
                self.jwt_secret = SecretStr(jwt_secret)
        elif is_production and len(jwt_secret) < 32:
            raise ValueError("JWT_SECRET must be at least 32 characters in production")
        return self

    def validate_production_settings(self) -> None:
        if self.app_env != "production":
            return
        if self.database_url is None:
            raise RuntimeError("DATABASE_URL is required when APP_ENV=production")
        if self.jwt_secret is None:
            raise RuntimeError("JWT_SECRET is required when APP_ENV=production")

    @property
    def database_url_value(self) -> str:
        if self.database_url is None:
            raise RuntimeError("DATABASE_URL has not been configured")
        return self.database_url.get_secret_value()

    @property
    def jwt_secret_value(self) -> str:
        if self.jwt_secret is None:
            raise RuntimeError("JWT_SECRET has not been configured")
        return self.jwt_secret.get_secret_value()

    @property
    def origins(self) -> list[str]:
        if self.allowed_origins:
            return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]
        if self.app_env == "production":
            return ["https://afubom-ride.vercel.app"]
        return ["http://localhost:5173", "http://127.0.0.1:5173"]


@lru_cache
def get_settings() -> Settings:
    return Settings()

