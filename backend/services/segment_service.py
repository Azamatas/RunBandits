import logging

from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.config import config
from backend.models.activity import Activity
from backend.models.segment import Segment, SegmentEffort
from backend.models.user import User

logger = logging.getLogger("runbanditsrun.services.segment")


def get_segment(db: Session, segment_id: int) -> Segment | None:
    logger.debug(f"Fetching segment by ID: {segment_id}")
    return db.query(Segment).filter(Segment.id == segment_id).first()


def list_segments(db: Session, limit: int = 20, offset: int = 0) -> list[Segment]:
    logger.debug(f"Listing segments with offset={offset}, limit={limit}")
    return db.query(Segment).offset(offset).limit(limit).all()


def create_segment(db: Session, data: dict) -> Segment:
    logger.info(f"Creating segment with data: {list(data.keys())}")
    segment = Segment(**data)
    db.add(segment)
    db.flush()
    db.refresh(segment)
    matched = _match_existing_activities(db, segment)
    db.commit()
    db.refresh(segment)
    if matched:
        logger.info(f"Segment {segment.id} matched {matched} existing activities")
    return segment


def _match_existing_activities(db: Session, segment: Segment) -> int:
    if segment.path is None:
        return 0

    buffer_m = config.SEGMENT_MATCH_BUFFER_METERS

    activities = (
        db.query(Activity)
        .filter(
            Activity.path.isnot(None),
            Activity.duration.isnot(None),
            Activity.distance.isnot(None),
            Activity.distance > 0,
            func.ST_DWithin(Activity.path, func.ST_StartPoint(segment.path), buffer_m),
            func.ST_DWithin(Activity.path, func.ST_EndPoint(segment.path), buffer_m),
        )
        .all()
    )

    created = 0
    for activity in activities:
        elapsed_time = _estimate_elapsed_time(activity, segment)
        if elapsed_time is None:
            continue
        effort = SegmentEffort(
            segment_id=segment.id,
            activity_id=activity.id,
            athlete_id=activity.owner_id,
            elapsed_time=elapsed_time,
            started_at=activity.started_at,
        )
        db.add(effort)
        created += 1

    if created:
        db.flush()

    return created


def get_leaderboard(db: Session, segment_id: int, limit: int = 10) -> list[dict]:
    logger.debug(f"Generating leaderboard for segment {segment_id} with limit={limit}")

    best_subq = (
        db.query(
            SegmentEffort.athlete_id.label("athlete_id"),
            func.min(SegmentEffort.elapsed_time).label("best_time"),
        )
        .filter(SegmentEffort.segment_id == segment_id)
        .group_by(SegmentEffort.athlete_id)
        .subquery()
    )

    results = (
        db.query(
            SegmentEffort.athlete_id,
            SegmentEffort.activity_id,
            User.username,
            best_subq.c.best_time,
            Activity.visibility,
        )
        .join(User, User.id == SegmentEffort.athlete_id)
        .join(
            best_subq,
            (SegmentEffort.athlete_id == best_subq.c.athlete_id)
            & (SegmentEffort.elapsed_time == best_subq.c.best_time)
            & (SegmentEffort.segment_id == segment_id),
        )
        .join(Activity, Activity.id == SegmentEffort.activity_id)
        .order_by(best_subq.c.best_time)
        .limit(limit)
        .all()
    )

    return [
        {
            "athlete_id": r.athlete_id,
            "athlete_name": r.username,
            "best_time": r.best_time,
            "rank": idx + 1,
            "activity_id": r.activity_id if r.visibility == "public" else None,
        }
        for idx, r in enumerate(results)
    ]


def get_user_efforts(db: Session, segment_id: int, user_id: int) -> list[SegmentEffort]:
    logger.debug(f"Fetching efforts for user {user_id} on segment {segment_id}")
    return (
        db.query(SegmentEffort)
        .filter(
            SegmentEffort.segment_id == segment_id,
            SegmentEffort.athlete_id == user_id,
        )
        .order_by(SegmentEffort.started_at.desc())
        .all()
    )


def match_segments_for_activity(db: Session, activity: Activity) -> int:
    """Find all segments the activity passes through and create SegmentEfforts."""
    if activity.path is None:
        return 0

    buffer_m = config.SEGMENT_MATCH_BUFFER_METERS

    matched_segments = (
        db.query(Segment)
        .filter(
            Segment.path.isnot(None),
            func.ST_DWithin(activity.path, func.ST_StartPoint(Segment.path), buffer_m),
            func.ST_DWithin(activity.path, func.ST_EndPoint(Segment.path), buffer_m),
        )
        .all()
    )

    created = 0
    for segment in matched_segments:
        already = (
            db.query(SegmentEffort.id)
            .filter(
                SegmentEffort.segment_id == segment.id,
                SegmentEffort.activity_id == activity.id,
            )
            .first()
        )
        if already:
            continue

        elapsed_time = _estimate_elapsed_time(activity, segment)
        if elapsed_time is None:
            continue

        effort = SegmentEffort(
            segment_id=segment.id,
            activity_id=activity.id,
            athlete_id=activity.owner_id,
            elapsed_time=elapsed_time,
            started_at=activity.started_at,
        )
        db.add(effort)
        created += 1

    if created:
        db.flush()
        logger.info(f"Activity {activity.id} matched {created} segment(s)")

    return created


def _estimate_elapsed_time(activity: Activity, segment: Segment) -> int | None:
    if not activity.duration or not activity.distance or activity.distance <= 0:
        return None
    if not segment.distance or segment.distance <= 0:
        return None
    return round(activity.duration * segment.distance / activity.distance)
