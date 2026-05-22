import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.exceptions import NotFoundError
from backend.models.activity import SportType
from backend.models.user import User
from backend.routers.deps import get_current_user
from backend.schemas.activity import ActivityCreate, ActivityOut, ActivityUpdate
from backend.services import activity_service
from backend.services.activity_service import ActivityCreateData, ActivityUpdateData

logger = logging.getLogger("runbanditsrun.routers.activities")

router = APIRouter(prefix="/activities", tags=["activities"])


@router.get("/", response_model=list[ActivityOut])
def list_activities(
    sport_type: SportType | None = Query(None),
    offset: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    logger.debug(
        f"User {current_user.id} listing activities with filters: sport={sport_type}, offset={offset}, limit={limit}"
    )
    return activity_service.list_activities(
        db, current_user.id, sport_type=sport_type, offset=offset, limit=limit
    )


@router.post("/", response_model=ActivityOut)
def create_activity(
    body: ActivityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    logger.info(f"User {current_user.id} creating activity")
    activity = activity_service.create_activity(
        db, current_user.id,
        ActivityCreateData(
            title=body.title,
            sport_type=body.sport_type,
            distance=body.distance,
            duration=body.duration,
            polyline=body.polyline,
            visibility=body.visibility,
            started_at=body.started_at,
        ),
        body.tagged_athlete_ids,
    )
    logger.info(f"User {current_user.id} created activity {activity.id}")
    return activity_service.enrich_activity(activity, current_user.id)


@router.get("/{activity_id}", response_model=ActivityOut)
def get_activity(
    activity_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    logger.debug(f"User {current_user.id} requested activity {activity_id}")
    try:
        activity = activity_service.get_activity(db, activity_id, current_user.id)
        return activity_service.enrich_activity(activity, current_user.id)
    except NotFoundError:
        logger.warning(f"Activity {activity_id} not found or not visible to user {current_user.id}")
        raise HTTPException(status_code=404, detail="Activity not found or not visible")


@router.patch("/{activity_id}", response_model=ActivityOut)
def update_activity(
    activity_id: int,
    body: ActivityUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    logger.info(f"User {current_user.id} updating activity {activity_id}")
    try:
        activity = activity_service.update_activity(
            db, activity_id, current_user.id,
            ActivityUpdateData(
                title=body.title,
                sport_type=body.sport_type,
                distance=body.distance,
                duration=body.duration,
                polyline=body.polyline,
                visibility=body.visibility,
                started_at=body.started_at,
            ),
        )
        logger.info(f"User {current_user.id} updated activity {activity_id}")
        return activity_service.enrich_activity(activity, current_user.id)
    except NotFoundError:
        logger.warning(f"Activity {activity_id} not found for update by user {current_user.id}")
        raise HTTPException(status_code=404, detail="Activity not found")


@router.delete("/{activity_id}", status_code=204)
def delete_activity(
    activity_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    logger.info(f"User {current_user.id} deleting activity {activity_id}")
    try:
        activity_service.delete_activity(db, activity_id, current_user.id)
        logger.info(f"User {current_user.id} deleted activity {activity_id}")
    except NotFoundError:
        logger.warning(f"Activity {activity_id} not found for deletion by user {current_user.id}")
        raise HTTPException(status_code=404, detail="Activity not found")
