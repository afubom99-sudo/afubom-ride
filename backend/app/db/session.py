import os
from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker
from sqlalchemy.pool import NullPool

from core.config import get_settings


def create_database_engine(database_url: str, serverless: bool = False):
    connect_args = {"check_same_thread": False} if database_url.startswith("sqlite") else {}
    engine_options = {"pool_pre_ping": True, "connect_args": connect_args}
    if serverless:
        engine_options["poolclass"] = NullPool
    elif not database_url.startswith("sqlite"):
        engine_options.update(pool_size=5, max_overflow=5, pool_recycle=1800)
    return create_engine(database_url, **engine_options)


settings = get_settings()
engine = create_database_engine(
    settings.database_url_value,
    serverless=os.getenv("VERCEL") == "1",
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
