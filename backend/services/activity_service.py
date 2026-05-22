from __future__ import annotations

import logging
from dataclasses import asdict, dataclass, fields
from datetime import datetime

from sqlalchemy import and_, or_, select
from sqlalchemy.orm import Query, Session, selectinload
from sqlalchemy.sql.selectable import CompoundSelect

from backend.exceptions import NotFoundError
from backend.models.activity import Activity, SportType, Visibility
from backend.models.friendship import Friendship, FriendshipStatus
from backend.models.user import User
from backend.schemas.activity import ActivityOut
from backend.services import common_activity_service

logger = logging.getLogger("runbanditsrun.services.activity")


def _query_activities_with_relations(db: Session) -> Query[Activity]:
    return db.query(Activity).options(selectinload(Activity.owner), selectinload(Activity.kudos))


def _get_friend_ids_subquery(viewer_id: int) -> CompoundSelect[tuple[int]]:
    return (
        select(Friendship.addressee_id)
        .where(Friendship.requester_id == viewer_id, Friendship.status == FriendshipStatus.ACCEPTED)
        .union(
            select(Friendship.requester_id).where(
                Friendship.addressee_id == viewer_id, Friendship.status == FriendshipStatus.ACCEPTED
            )
        )
    )


def _filter_visible_activities(query: Query[Activity], viewer_id: int) -> Query[Activity]:
    friend_ids_subquery = _get_friend_ids_subquery(viewer_id)
    return query.filter(
        or_(
            Activity.visibility == Visibility.PUBLIC,
            Activity.owner_id == viewer_id,
            and_(
                Activity.visibility == Visibility.FRIENDS,
                Activity.owner_id.in_(friend_ids_subquery),
            ),
        )
    )


def _is_friend(db: Session, user_id: int, other_id: int) -> bool:
    return (
        db.query(Friendship)
        .filter(
            Friendship.status == FriendshipStatus.ACCEPTED,
            ((Friendship.requester_id == user_id) & (Friendship.addressee_id == other_id))
            | ((Friendship.requester_id == other_id) & (Friendship.addressee_id == user_id)),
        )
        .first()
        is not None
    )


def can_view(db: Session, activity: Activity, viewer_id: int | None) -> bool:
    if activity.visibility == Visibility.PUBLIC:
        return True
    if viewer_id is None:
        return False
    if activity.owner_id == viewer_id:
        return True
    if activity.visibility == Visibility.FRIENDS:
        return _is_friend(db, viewer_id, activity.owner_id)
    return False


def enrich_activity(activity: Activity, user_id: int) -> ActivityOut:
    return ActivityOut.model_validate({
        **activity.__dict__,
        "kudos_count": len(activity.kudos),
        "owner_username": activity.owner.username,
        "user_has_kudos": any(k.user_id == user_id for k in activity.kudos),
    })


@dataclass
class ActivityCreateData:
    title: str
    sport_type: SportType
    distance: float | None = None
    duration: int | None = None
    polyline: str | None = None
    visibility: Visibility = Visibility.PUBLIC
    started_at: datetime | None = None


@dataclass
class ActivityUpdateData:
    title: str | None = None
    sport_type: SportType | None = None
    distance: float | None = None
    duration: int | None = None
    polyline: str | None = None
    visibility: Visibility | None = None
    started_at: datetime | None = None


def create_activity(db: Session, owner_id: int, data: ActivityCreateData, tagged_ids: list[int]) -> Activity:
    logger.info(f"Creating activity for user {owner_id} with data: {list(asdict(data).keys())}")
    activity = Activity(owner_id=owner_id, **asdict(data))
    if tagged_ids:
        tagged = db.query(User).filter(User.id.in_(tagged_ids)).all()
        activity.tagged_athletes = tagged
    db.add(activity)
    db.flush()
    db.refresh(activity)
    common_activity_service.link_activity_to_closest_common(db, activity)
    from backend.services import segment_service
    segment_service.match_segments_for_activity(db, activity)
    db.commit()
    logger.info(f"Created activity {activity.id} for user {owner_id}")
    return activity


def get_activity(db: Session, activity_id: int, viewer_id: int | None) -> Activity:
    logger.debug(f"Fetching activity {activity_id} for viewer {viewer_id}")
    activity = _query_activities_with_relations(db).filter(Activity.id == activity_id).first()
    if not activity or not can_view(db, activity, viewer_id):
        logger.warning(f"Activity {activity_id} not found or not visible to viewer {viewer_id}")
        raise NotFoundError("Activity not found or not visible")
    return activity


def update_activity(db: Session, activity_id: int, owner_id: int, updates: ActivityUpdateData) -> Activity:
    logger.info(f"Updating activity {activity_id} by owner {owner_id}")
    activity = (
        _query_activities_with_relations(db)
        .filter(Activity.id == activity_id, Activity.owner_id == owner_id)
        .first()
    )
    if not activity:
        logger.warning(f"Activity {activity_id} not found for owner {owner_id}")
        raise NotFoundError("Activity not found")
    for field in fields(updates):
        value = getattr(updates, field.name)
        if value is not None:
            setattr(activity, field.name, value)
    db.commit()
    db.refresh(activity)
    logger.info(f"Updated activity {activity_id}")
    return activity


def delete_activity(db: Session, activity_id: int, owner_id: int) -> None:
    logger.info(f"Deleting activity {activity_id} by owner {owner_id}")
    activity = (
        db.query(Activity)
        .filter(Activity.id == activity_id, Activity.owner_id == owner_id)
        .first()
    )
    if not activity:
        logger.warning(f"Activity {activity_id} not found for deletion by owner {owner_id}")
        raise NotFoundError("Activity not found")
    db.delete(activity)
    db.commit()
    logger.info(f"Deleted activity {activity_id}")


def list_activities(
    db: Session, viewer_id: int, sport_type=None, offset: int = 0, limit: int = 20
) -> list[ActivityOut]:
    logger.debug(
        f"Listing activities for viewer {viewer_id} with filters: sport={sport_type}, offset={offset}, limit={limit}"
    )
    query = _query_activities_with_relations(db)
    query = _filter_visible_activities(query, viewer_id)
    if sport_type:
        query = query.filter(Activity.sport_type == sport_type)
    activities = query.order_by(Activity.created_at.desc()).offset(offset).limit(limit).all()
    return [enrich_activity(a, viewer_id) for a in activities]
