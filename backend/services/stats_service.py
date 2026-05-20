import logging

from sqlalchemy import func
from sqlalchemy.orm import Query, Session

from backend.models.activity import Activity, SportType
from backend.schemas.stats import PersonalRecord, StatsTotals
from backend.services.activity_service import _filter_visible_activities

logger = logging.getLogger("runbanditsrun.services.stats")

MIN_PACE_DISTANCE_METERS = 1000


def _visible_for(db: Session, owner_id: int, viewer_id: int) -> Query[Activity]:
    query = db.query(Activity).filter(Activity.owner_id == owner_id)
    return _filter_visible_activities(query, viewer_id)


def get_totals(
    db: Session,
    user_id: int,
    viewer_id: int,
    sport_type: SportType | None = None,
) -> dict[str, StatsTotals]:
    logger.debug(f"Calculating totals for user {user_id} (viewer={viewer_id}, sport={sport_type})")
    visible = _visible_for(db, user_id, viewer_id).subquery()
    query = db.query(
        visible.c.sport_type,
        func.count(visible.c.id).label("count"),
        func.sum(visible.c.distance).label("total_distance"),
        func.sum(visible.c.elevation).label("total_elevation"),
        func.sum(visible.c.duration).label("total_duration"),
    )
    if sport_type:
        query = query.filter(visible.c.sport_type == sport_type)
    rows = query.group_by(visible.c.sport_type).all()

    return {
        row.sport_type: StatsTotals(
            count=row.count,
            total_distance=row.total_distance or 0,
            total_elevation=row.total_elevation or 0,
            total_duration=row.total_duration or 0,
        )
        for row in rows
    }


def _best_by(
    db: Session,
    owner_id: int,
    viewer_id: int,
    sport: str,
    column,
    direction: str = "desc",
    where=None,
) -> Activity | None:
    query = _visible_for(db, owner_id, viewer_id).filter(
        Activity.sport_type == sport, column.isnot(None)
    )
    if where is not None:
        query = query.filter(where)
    order = column.desc() if direction == "desc" else column.asc()
    return query.order_by(order).first()


def get_personal_records(
    db: Session, user_id: int, viewer_id: int
) -> list[PersonalRecord]:
    logger.debug(f"Computing PRs for user {user_id} (viewer={viewer_id})")
    sports = (
        _visible_for(db, user_id, viewer_id)
        .with_entities(Activity.sport_type)
        .distinct()
        .all()
    )

    pace_expr = Activity.duration * 1.0 / Activity.distance
    records: list[PersonalRecord] = []
    for (sport,) in sports:
        longest = _best_by(db, user_id, viewer_id, sport, Activity.distance, "desc")
        if longest:
            records.append(PersonalRecord(
                sport_type=sport,
                record_type="longest_distance",
                value=float(longest.distance or 0),
                activity_id=longest.id,
                achieved_at=longest.started_at or longest.created_at,
            ))

        longest_t = _best_by(db, user_id, viewer_id, sport, Activity.duration, "desc")
        if longest_t:
            records.append(PersonalRecord(
                sport_type=sport,
                record_type="longest_duration",
                value=float(longest_t.duration or 0),
                activity_id=longest_t.id,
                achieved_at=longest_t.started_at or longest_t.created_at,
            ))

        fastest = _best_by(
            db, user_id, viewer_id, sport, pace_expr, "asc",
            where=(Activity.distance >= MIN_PACE_DISTANCE_METERS) & (Activity.duration.isnot(None)),
        )
        if fastest and fastest.distance and fastest.duration:
            pace = fastest.duration / (fastest.distance / 1000)
            speed_mps = fastest.distance / fastest.duration
            records.append(PersonalRecord(
                sport_type=sport,
                record_type="fastest_pace",
                value=float(pace),
                activity_id=fastest.id,
                achieved_at=fastest.started_at or fastest.created_at,
            ))
            records.append(PersonalRecord(
                sport_type=sport,
                record_type="fastest_speed",
                value=float(speed_mps),
                activity_id=fastest.id,
                achieved_at=fastest.started_at or fastest.created_at,
            ))

        climb = _best_by(db, user_id, viewer_id, sport, Activity.elevation, "desc")
        if climb and climb.elevation and climb.elevation > 0:
            records.append(PersonalRecord(
                sport_type=sport,
                record_type="biggest_climb",
                value=float(climb.elevation),
                activity_id=climb.id,
                achieved_at=climb.started_at or climb.created_at,
            ))

    return records
