from fastapi import Depends, HTTPException, Header
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.user import User
from backend.services import auth_service


def get_current_user(authorization: str = Header(...), db: Session = Depends(get_db)) -> User:
    try:
        token = authorization.removeprefix("Bearer ")
        user_id = auth_service.decode_token(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user
