import logging
from datetime import UTC, datetime, timedelta

import bcrypt
from jose import jwt
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from backend.config import config
from backend.exceptions import ConflictError, UnauthorizedError
from backend.models.user import User

logger = logging.getLogger("runbanditsrun.services.auth")

logger = logging.getLogger("runbanditsrun.services.auth")


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8")[:72], bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8")[:72], hashed.encode("utf-8"))


def create_access_token(user_id: int) -> str:
    expire = datetime.now(UTC) + timedelta(minutes=config.ACCESS_TOKEN_EXPIRE_MINUTES)
    logger.debug(f"Creating access token for user {user_id}")
    return jwt.encode(
        {"sub": str(user_id), "exp": expire, "type": "access"}, config.JWT_SECRET_KEY, algorithm=config.JWT_ALGORITHM
    )


def create_refresh_token(user_id: int) -> str:
    expire = datetime.now(UTC) + timedelta(days=config.REFRESH_TOKEN_EXPIRE_DAYS)
    logger.debug(f"Creating refresh token for user {user_id}")
    return jwt.encode(
        {"sub": str(user_id), "exp": expire, "type": "refresh"}, config.JWT_SECRET_KEY, algorithm=config.JWT_ALGORITHM
    )


def decode_token(token: str) -> dict:
    payload = jwt.decode(token, config.JWT_SECRET_KEY, algorithms=[config.JWT_ALGORITHM])
    return payload


def decode_access_token(token: str) -> dict:
    payload = jwt.decode(token, config.JWT_SECRET_KEY, algorithms=[config.JWT_ALGORITHM])
    if payload.get("type") != "access":
        logger.warning("Invalid token type: expected access")
        raise UnauthorizedError("Invalid token type: expected access")
    return payload


def decode_refresh_token(token: str) -> dict:
    payload = jwt.decode(token, config.JWT_SECRET_KEY, algorithms=[config.JWT_ALGORITHM])
    if payload.get("type") != "refresh":
        logger.warning("Invalid token type: expected refresh")
        raise UnauthorizedError("Invalid token type: expected refresh")
    return payload


def get_user_by_email(db: Session, email: str) -> User | None:
    logger.debug(f"Fetching user by email: {email}")
    return db.query(User).filter(User.email == email).first()


def get_user_by_username(db: Session, username: str) -> User | None:
    logger.debug(f"Fetching user by username: {username}")
    return db.query(User).filter(User.username == username).first()


def get_user_by_id(db: Session, user_id: int) -> User | None:
    logger.debug(f"Fetching user by ID: {user_id}")
    return db.query(User).filter(User.id == user_id).first()


def register_user(db: Session, username: str, email: str, password: str) -> User:
    logger.info(f"Registering new user with email: {email}, username: {username}")
    user = User(username=username, email=email, password_hash=hash_password(password))
    db.add(user)
    try:
        db.commit()
    except IntegrityError as e:
        db.rollback()
        msg = str(e.orig) if e.orig else ""
        if "email" in msg.lower():
            logger.warning(f"Registration failed: email {email} already registered")
            raise ConflictError("Email already registered")
        logger.warning(f"Registration failed: username {username} already taken")
        raise ConflictError("Username already taken")
    db.refresh(user)
    logger.info(f"User registered successfully with ID: {user.id}")
    return user
