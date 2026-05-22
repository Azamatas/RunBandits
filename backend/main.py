import logging
import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import config
from backend.logging_config import setup_logging
from backend.middleware.logging_middleware import LoggingMiddleware
from backend.routers import activities, auth, common_activities, feed, kudos, segments, stats, users

load_dotenv()

setup_logging()

logger = logging.getLogger("runbanditsrun")

if config.JWT_SECRET_KEY == "change-me-in-production":
    logger.warning("Using default JWT secret key — set JWT_SECRET_KEY env var in production!")

app = FastAPI(title="RunBanditsRun")

app.add_middleware(LoggingMiddleware)


CORS_ORIGINS = os.environ.get("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
if CORS_ORIGINS == ["*"]:
    allowed_origins = ["*"]
else:
    allowed_origins = CORS_ORIGINS

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(activities.router, prefix="/api")
app.include_router(kudos.router, prefix="/api")
app.include_router(feed.router, prefix="/api")
app.include_router(stats.router, prefix="/api")
app.include_router(common_activities.router, prefix="/api")
app.include_router(segments.router, prefix="/api")

from backend.static_files import mount_static_files  # noqa: E402

mount_static_files(app)

logger.info("RunBanditsRun backend started")
