import logging
import os

logger = logging.getLogger("runbanditsrun.config")


class Config:
    DATABASE_URL = os.environ.get(
        "DATABASE_URL", "postgresql://runbandits:runbandits@localhost:5432/runbandits"
    )

    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "change-me-in-production")
    JWT_ALGORITHM = os.environ.get("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    REFRESH_TOKEN_EXPIRE_DAYS = int(os.environ.get("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

    ALLOWED_ORIGINS = os.environ.get("ALLOWED_ORIGINS", "http://localhost:5173").split(",")

    COMMON_ACTIVITY_MIN_FRECHET_DISTANCE_METERS = float(os.environ.get("COMMON_ACTIVITY_MIN_FRECHET_DISTANCE_METERS", "25.0"))
    COMMON_ACTIVITY_LINK_FRECHET_DISTANCE_METERS = float(os.environ.get("COMMON_ACTIVITY_LINK_FRECHET_DISTANCE_METERS", "25.0"))

    SEGMENT_MATCH_BUFFER_METERS = float(os.environ.get("SEGMENT_MATCH_BUFFER_METERS", "30.0"))


config = Config()

logger.info("Configuration loaded")
logger.debug(f"DATABASE_URL: {config.DATABASE_URL}")
logger.debug(f"COMMON_ACTIVITY_MIN_FRECHET_DISTANCE_METERS: {config.COMMON_ACTIVITY_MIN_FRECHET_DISTANCE_METERS}")
logger.debug(f"COMMON_ACTIVITY_LINK_FRECHET_DISTANCE_METERS: {config.COMMON_ACTIVITY_LINK_FRECHET_DISTANCE_METERS}")
