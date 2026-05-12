from sqlalchemy.orm import Session
from backend.models.activity import Activity, Visibility
from backend.models.friendship import Friendship, FriendshipStatus


def _is_friend(db: Session, user_id: int, other_id: int) -> bool:
    return db.query(Friendship).filter(
        Friendship.status == FriendshipStatus.ACCEPTED,
        ((Friendship.requester_id == user_id) & (Friendship.addressee_id == other_id)) |
        ((Friendship.requester_id == other_id) & (Friendship.addressee_id == user_id))
    ).first() is not None


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


def create_activity(db: Session, owner_id: int, data: dict, tagged_ids: list[int]) -> Activity:
    from backend.models.user import User
    activity = Activity(owner_id=owner_id, **data)
    if tagged_ids:
        tagged = db.query(User).filter(User.id.in_(tagged_ids)).all()
        activity.tagged_athletes = tagged
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return activity


def get_activity(db: Session, activity_id: int, viewer_id: int | None) -> Activity | None:
    activity = db.query(Activity).filter(Activity.id == activity_id).first()
    if activity and can_view(db, activity, viewer_id):
        return activity
    return None
