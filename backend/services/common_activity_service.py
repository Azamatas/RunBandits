import logging
from dataclasses import dataclass

from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from backend.config import config
from backend.exceptions import ConflictError, NotFoundError
from backend.models.activity import Activity
from backend.models.common_activity import CommonActivity
from backend.models.user import User
from backend.schemas.activity import ActivityOut
from backend.schemas.common_activity import LeaderboardEntry

logger = logging.getLogger("runbanditsrun.services.common_activity")


@dataclass
class CommonActivityCreateData:
    name: str
    sport_type: str
    polyline: str


def _link_existing_activities(db: Session, common_activity_id: int, sport_type: str, path_geom) -> int:
    link_meters = config.COMMON_ACTIVITY_LINK_FRECHET_DISTANCE_METERS

    subq = (
        select(Activity.id)
        .where(
            Activity.sport_type == sport_type,
            Activity.common_activity_id.is_(None),
            Activity.path.isnot(None),
            func.ST_FrechetDistance(Activity.path, path_geom) < link_meters,
        )
    ).scalar_subquery()

    result = db.execute(
        update(Activity)
        .where(Activity.id.in_(subq))
        .values(common_activity_id=common_activity_id)
    )
    return result.rowcount  # type: ignore[no-any-return, attr-defined]


def create_common_activity(db: Session, data: CommonActivityCreateData) -> CommonActivity:
    sport_type = data.sport_type
    polyline = data.polyline

    ca = CommonActivity(name=data.name, sport_type=sport_type, polyline=polyline)
    db.add(ca)
    db.flush()
    db.refresh(ca)

    min_meters = config.COMMON_ACTIVITY_MIN_FRECHET_DISTANCE_METERS
    too_close = (
        db.query(CommonActivity.id)
        .filter(
            CommonActivity.sport_type == sport_type,
            CommonActivity.id != ca.id,
            func.ST_FrechetDistance(CommonActivity.path, ca.path) < min_meters,
        )
        .first()
    )
    if too_close:
        db.rollback()
        raise ConflictError("A common activity with a very similar route already exists")

    linked_count = _link_existing_activities(db, ca.id, sport_type, ca.path)
    if linked_count:
        logger.info(
            "Common activity %d linked %d existing activities", ca.id, linked_count
        )

    db.commit()
    db.refresh(ca)
    logger.info("Created common activity %d: %s", ca.id, data.name)
    return ca


def link_activity_to_closest_common(db: Session, activity: Activity) -> None:
    if activity.path is None:
        return
    link_meters = config.COMMON_ACTIVITY_LINK_FRECHET_DISTANCE_METERS
    closest = (
        db.query(CommonActivity.id, func.ST_FrechetDistance(CommonActivity.path, activity.path).label("dist"))
        .filter(
            CommonActivity.sport_type == activity.sport_type,
            func.ST_FrechetDistance(CommonActivity.path, activity.path) < link_meters,
        )
        .order_by(func.ST_FrechetDistance(CommonActivity.path, activity.path))
        .first()
    )
    if closest:
        activity.common_activity_id = closest.id
        db.flush()
        logger.info("Activity %d auto-linked to common activity %d", activity.id, closest.id)


def get_common_activity(db: Session, common_activity_id: int) -> CommonActivity:
    logger.debug("Fetching common activity by ID: %d", common_activity_id)
    ca = db.query(CommonActivity).filter(CommonActivity.id == common_activity_id).first()
    if not ca:
        raise NotFoundError("Common activity not found")
    return ca


def list_common_activities(
    db: Session,
    sport_type: str | None = None,
    limit: int = 20,
    offset: int = 0,
) -> list[CommonActivity]:
    logger.debug("Listing common activities with offset=%d, limit=%d", offset, limit)
    query = db.query(CommonActivity)
    if sport_type:
        query = query.filter(CommonActivity.sport_type == sport_type)
    query = query.offset(offset).limit(limit)
    return query.all()


def list_linked_activities(
    db: Session,
    common_activity_id: int,
    viewer_id: int,
    limit: int = 20,
    offset: int = 0,
) -> list[ActivityOut]:
    from backend.services.activity_service import (
        _filter_visible_activities,
        _query_activities_with_relations,
        enrich_activity,
    )

    logger.debug(
        "Listing activities linked to common %d for viewer %d (offset=%d, limit=%d)",
        common_activity_id, viewer_id, offset, limit,
    )
    query = _query_activities_with_relations(db).filter(
        Activity.common_activity_id == common_activity_id
    )
    query = _filter_visible_activities(query, viewer_id)
    activities = query.order_by(Activity.duration.asc().nulls_last()).offset(offset).limit(limit).all()
    return [enrich_activity(a, viewer_id) for a in activities]


def get_leaderboard(db: Session, common_activity_id: int, limit: int = 10) -> list[LeaderboardEntry]:
    logger.debug(
        "Generating leaderboard for common activity %d with limit=%d",
        common_activity_id,
        limit,
    )

    results = (
        db.query(
            User.id.label("athlete_id"),
            User.username.label("athlete_name"),
            func.min(Activity.duration).label("best_time"),
        )
        .join(User, User.id == Activity.owner_id)
        .join(CommonActivity, CommonActivity.id == Activity.common_activity_id)
        .filter(CommonActivity.id == common_activity_id, Activity.duration.isnot(None))
        .group_by(User.id, User.username)
        .order_by(func.min(Activity.duration))
        .limit(limit)
        .all()
    )

    return [
        LeaderboardEntry(
            athlete_id=r.athlete_id,
            athlete_name=r.athlete_name,
            best_time=r.best_time,
            rank=idx + 1,
        )
        for idx, r in enumerate(results)
    ]
