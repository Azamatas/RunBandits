from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.user import User
from backend.services import stats_service
from backend.routers.deps import get_current_user

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("/me")
def my_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return {
        "totals": stats_service.get_totals(db, current_user.id),
        "personal_records": stats_service.get_personal_records(db, current_user.id),
    }
