from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.user import User
from backend.schemas.activity import ActivityCreate, ActivityOut, ActivityUpdate
from backend.services import activity_service
from backend.routers.deps import get_current_user

router = APIRouter(prefix="/activities", tags=["activities"])


@router.post("/", response_model=ActivityOut)
def create_activity(body: ActivityCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    data = body.model_dump(exclude={"tagged_athlete_ids"})
    activity = activity_service.create_activity(db, current_user.id, data, body.tagged_athlete_ids)
    return {**activity.__dict__, "kudos_count": len(activity.kudos)}


@router.get("/{activity_id}", response_model=ActivityOut)
def get_activity(activity_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    activity = activity_service.get_activity(db, activity_id, current_user.id)
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found or not visible")
    return {**activity.__dict__, "kudos_count": len(activity.kudos)}


@router.patch("/{activity_id}", response_model=ActivityOut)
def update_activity(activity_id: int, body: ActivityUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from backend.models.activity import Activity
    activity = db.query(Activity).filter(Activity.id == activity_id, Activity.owner_id == current_user.id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(activity, field, value)
    db.commit()
    db.refresh(activity)
    return {**activity.__dict__, "kudos_count": len(activity.kudos)}


@router.delete("/{activity_id}", status_code=204)
def delete_activity(activity_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from backend.models.activity import Activity
    activity = db.query(Activity).filter(Activity.id == activity_id, Activity.owner_id == current_user.id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    db.delete(activity)
    db.commit()
