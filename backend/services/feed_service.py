from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from backend.models.activity import Activity, Visibility
from backend.models.friendship import Friendship, FriendshipStatus


def get_feed(db: Session, viewer_id: int, limit: int = 20, offset: int = 0) -> list[Activity]:
    friend_ids_subquery = db.query(
        Friendship.addressee_id
    ).filter(
        Friendship.requester_id == viewer_id,
        Friendship.status == FriendshipStatus.ACCEPTED
    ).union(
        db.query(Friendship.requester_id).filter(
            Friendship.addressee_id == viewer_id,
            Friendship.status == FriendshipStatus.ACCEPTED
        )
    ).subquery()

    return db.query(Activity).filter(
        or_(
            Activity.visibility == Visibility.PUBLIC,
            Activity.owner_id == viewer_id,
            and_(
                Activity.visibility == Visibility.FRIENDS,
                Activity.owner_id.in_(friend_ids_subquery)
            )
        )
    ).order_by(Activity.created_at.desc()).offset(offset).limit(limit).all()
