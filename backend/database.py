import logging

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from backend.config import config

logger = logging.getLogger("runbanditsrun.database")

logger.info(f"Connecting to database: {config.DATABASE_URL}")

engine = create_engine(config.DATABASE_URL)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

logger.info("Database connection established")


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        logger.debug("Database session closed")
