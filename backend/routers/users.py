from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.user import User
from backend.models.friendship import Friendship, FriendshipStatus
from backend.schemas.user import UserOut, UserUpdate
from backend.routers.deps import get_current_user

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserOut)
def update_me(body: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/{user_id}", response_model=UserOut)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/{user_id}/follow", status_code=201)
def follow_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")
    existing = db.query(Friendship).filter(
        Friendship.requester_id == current_user.id,
        Friendship.addressee_id == user_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Request already sent")
    db.add(Friendship(requester_id=current_user.id, addressee_id=user_id))
    db.commit()
    return {"status": "pending"}


@router.post("/{user_id}/accept", status_code=200)
def accept_follow(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    friendship = db.query(Friendship).filter(
        Friendship.requester_id == user_id,
        Friendship.addressee_id == current_user.id,
        Friendship.status == FriendshipStatus.PENDING
    ).first()
    if not friendship:
        raise HTTPException(status_code=404, detail="No pending request")
    friendship.status = FriendshipStatus.ACCEPTED
    db.commit()
    return {"status": "accepted"}
