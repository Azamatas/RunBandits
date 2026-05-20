import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models.activity import SportType
from backend.models.user import User
from backend.routers.deps import get_current_user
from backend.schemas.stats import StatsResponse
from backend.services import stats_service

logger = logging.getLogger("runbanditsrun.routers.stats")

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("/me", response_model=StatsResponse)
def my_stats(
    sport_type: SportType | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    logger.debug(f"User {current_user.id} fetching own stats (sport={sport_type})")
    return {
        "totals": stats_service.get_totals(
            db, current_user.id, viewer_id=current_user.id, sport_type=sport_type
        ),
        "personal_records": stats_service.get_personal_records(
            db, current_user.id, viewer_id=current_user.id
        ),
    }


@router.get("/users/{user_id}", response_model=StatsResponse)
def user_stats(
    user_id: int,
    sport_type: SportType | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    logger.debug(f"User {current_user.id} fetching stats for user {user_id} (sport={sport_type})")
    if not db.query(User.id).filter(User.id == user_id).first():
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "totals": stats_service.get_totals(
            db, user_id, viewer_id=current_user.id, sport_type=sport_type
        ),
        "personal_records": stats_service.get_personal_records(
            db, user_id, viewer_id=current_user.id
        ),
    }
