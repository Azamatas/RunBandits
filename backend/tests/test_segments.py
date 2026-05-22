import pytest

from backend.models.activity import Activity, SportType, Visibility
from backend.models.segment import Segment, SegmentEffort
from backend.services.segment_service import (
    _estimate_elapsed_time,
    _match_existing_activities,
    create_segment,
    get_leaderboard,
    get_user_efforts,
    match_segments_for_activity,
)

VONDELPARK_POLYLINE = "{cq~Hw{u\\oFrSsI~MoKzE{JcLcB{TzE_SjM_IvLvBrIvQ"
AMSTEL_POLYLINE = "_ko~Hsh}\\_NsIcQ{EoP_DoPkCsNkC"


def make_segment(db, polyline=VONDELPARK_POLYLINE, name="Test Segment"):
    seg = Segment(name=name, polyline=polyline)
    db.add(seg)
    db.flush()
    db.refresh(seg)
    return seg


def make_activity(db, owner_id, polyline=None, distance=2300.0, duration=720, **kwargs):
    defaults = dict(
        owner_id=owner_id,
        title="Test Run",
        sport_type=SportType.RUN,
        distance=distance,
        duration=duration,
        visibility=Visibility.PUBLIC,
    )
    defaults.update(kwargs)
    if polyline:
        defaults["polyline"] = polyline
    a = Activity(**defaults)
    db.add(a)
    db.flush()
    db.refresh(a)
    return a


class TestSegmentEndpoints:
    def test_create_segment(self, client, auth_user):
        _, headers = auth_user
        resp = client.post(
            "/api/segments/",
            json={"name": "Sprint", "polyline": VONDELPARK_POLYLINE},
            headers=headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["name"] == "Sprint"
        assert data["distance"] is not None
        assert data["distance"] > 0

    def test_create_segment_requires_auth(self, client):
        resp = client.post("/api/segments/", json={"name": "Sprint", "polyline": VONDELPARK_POLYLINE})
        assert resp.status_code == 401

    def test_list_segments(self, client, db, auth_user):
        _, headers = auth_user
        make_segment(db, name="A")
        make_segment(db, polyline=AMSTEL_POLYLINE, name="B")
        db.commit()
        resp = client.get("/api/segments/", headers=headers)
        assert resp.status_code == 200
        assert len(resp.json()) >= 2

    def test_get_segment(self, client, db, auth_user):
        _, headers = auth_user
        seg = make_segment(db)
        db.commit()
        resp = client.get(f"/api/segments/{seg.id}", headers=headers)
        assert resp.status_code == 200
        assert resp.json()["id"] == seg.id

    def test_get_segment_not_found(self, client, auth_user):
        _, headers = auth_user
        resp = client.get("/api/segments/999999", headers=headers)
        assert resp.status_code == 404

    def test_leaderboard_empty(self, client, db, auth_user):
        _, headers = auth_user
        seg = make_segment(db)
        db.commit()
        resp = client.get(f"/api/segments/{seg.id}/leaderboard", headers=headers)
        assert resp.status_code == 200
        assert resp.json() == []

    def test_efforts_empty(self, client, db, auth_user):
        _, headers = auth_user
        seg = make_segment(db)
        db.commit()
        resp = client.get(f"/api/segments/{seg.id}/efforts", headers=headers)
        assert resp.status_code == 200
        assert resp.json() == []


class TestEstimateElapsedTime:
    def test_proportional_calculation(self, db):
        user_activity = Activity(
            owner_id=1, title="R", sport_type=SportType.RUN,
            distance=5000.0, duration=1500,
        )
        segment = Segment(name="S", distance=1000.0)
        assert _estimate_elapsed_time(user_activity, segment) == 300

    def test_returns_none_without_duration(self, db):
        a = Activity(owner_id=1, title="R", sport_type=SportType.RUN, distance=5000.0, duration=None)
        s = Segment(name="S", distance=1000.0)
        assert _estimate_elapsed_time(a, s) is None

    def test_returns_none_without_distance(self, db):
        a = Activity(owner_id=1, title="R", sport_type=SportType.RUN, distance=None, duration=1500)
        s = Segment(name="S", distance=1000.0)
        assert _estimate_elapsed_time(a, s) is None

    def test_returns_none_without_segment_distance(self, db):
        a = Activity(owner_id=1, title="R", sport_type=SportType.RUN, distance=5000.0, duration=1500)
        s = Segment(name="S", distance=None)
        assert _estimate_elapsed_time(a, s) is None

    def test_returns_none_when_activity_distance_zero(self, db):
        a = Activity(owner_id=1, title="R", sport_type=SportType.RUN, distance=0.0, duration=1500)
        s = Segment(name="S", distance=1000.0)
        assert _estimate_elapsed_time(a, s) is None


class TestSegmentMatching:
    def test_matching_creates_effort(self, db, auth_user):
        user, _ = auth_user
        seg = make_segment(db)
        db.commit()

        activity = make_activity(db, user.id, polyline=VONDELPARK_POLYLINE)
        db.commit()

        count = match_segments_for_activity(db, activity)
        assert count >= 1

        efforts = get_user_efforts(db, seg.id, user.id)
        assert len(efforts) == 1
        assert efforts[0].elapsed_time > 0

    def test_no_match_without_polyline(self, db, auth_user):
        user, _ = auth_user
        make_segment(db)
        db.commit()

        activity = make_activity(db, user.id, polyline=None)
        db.commit()

        count = match_segments_for_activity(db, activity)
        assert count == 0

    def test_no_match_without_duration(self, db, auth_user):
        user, _ = auth_user
        make_segment(db)
        db.commit()

        activity = make_activity(db, user.id, polyline=VONDELPARK_POLYLINE, duration=None)
        db.commit()

        count = match_segments_for_activity(db, activity)
        assert count == 0

    def test_no_duplicate_effort(self, db, auth_user):
        user, _ = auth_user
        seg = make_segment(db)
        db.commit()

        activity = make_activity(db, user.id, polyline=VONDELPARK_POLYLINE)
        db.commit()

        match_segments_for_activity(db, activity)
        count2 = match_segments_for_activity(db, activity)
        assert count2 == 0

        efforts = get_user_efforts(db, seg.id, user.id)
        assert len(efforts) == 1

    def test_different_segment_no_match(self, db, auth_user):
        user, _ = auth_user
        seg = make_segment(db, polyline=AMSTEL_POLYLINE, name="Amstel")
        db.commit()

        activity = make_activity(db, user.id, polyline=VONDELPARK_POLYLINE)
        db.commit()

        match_segments_for_activity(db, activity)

        efforts = get_user_efforts(db, seg.id, user.id)
        assert len(efforts) == 0


class TestRetroactiveMatching:
    def test_existing_activity_matched_on_segment_create(self, db, auth_user):
        user, _ = auth_user
        activity = make_activity(db, user.id, polyline=VONDELPARK_POLYLINE)
        db.commit()

        seg = create_segment(db, {"name": "Vondelpark", "polyline": VONDELPARK_POLYLINE})

        efforts = get_user_efforts(db, seg.id, user.id)
        assert len(efforts) == 1
        assert efforts[0].activity_id == activity.id

    def test_no_retroactive_match_without_polyline(self, db, auth_user):
        user, _ = auth_user
        make_activity(db, user.id, polyline=None)
        db.commit()

        seg = create_segment(db, {"name": "Vondelpark", "polyline": VONDELPARK_POLYLINE})

        efforts = get_user_efforts(db, seg.id, user.id)
        assert len(efforts) == 0


class TestLeaderboard:
    def test_leaderboard_ordered_by_time(self, db, auth_user, second_user):
        user, _ = auth_user
        seg = make_segment(db)
        a1 = make_activity(db, user.id, duration=500)
        a2 = make_activity(db, second_user.id, duration=400)
        db.commit()

        db.add(SegmentEffort(segment_id=seg.id, activity_id=a1.id, athlete_id=user.id, elapsed_time=500))
        db.add(SegmentEffort(segment_id=seg.id, activity_id=a2.id, athlete_id=second_user.id, elapsed_time=400))
        db.commit()

        board = get_leaderboard(db, seg.id)
        assert board[0]["best_time"] == 400
        assert board[0]["rank"] == 1
        assert board[1]["best_time"] == 500
        assert board[1]["rank"] == 2

    def test_leaderboard_best_effort_per_athlete(self, db, auth_user):
        user, _ = auth_user
        seg = make_segment(db)
        a1 = make_activity(db, user.id, duration=600)
        a2 = make_activity(db, user.id, duration=500)
        db.commit()

        db.add(SegmentEffort(segment_id=seg.id, activity_id=a1.id, athlete_id=user.id, elapsed_time=600))
        db.add(SegmentEffort(segment_id=seg.id, activity_id=a2.id, athlete_id=user.id, elapsed_time=500))
        db.commit()

        board = get_leaderboard(db, seg.id)
        assert len(board) == 1
        assert board[0]["best_time"] == 500

    def test_leaderboard_hides_activity_id_for_private(self, db, auth_user):
        user, _ = auth_user
        seg = make_segment(db)
        private_activity = Activity(
            owner_id=user.id, title="R", sport_type=SportType.RUN, visibility=Visibility.PRIVATE
        )
        db.add(private_activity)
        db.flush()
        db.add(SegmentEffort(
            segment_id=seg.id, activity_id=private_activity.id,
            athlete_id=user.id, elapsed_time=500,
        ))
        db.commit()

        board = get_leaderboard(db, seg.id)
        assert board[0]["activity_id"] is None

    def test_leaderboard_shows_activity_id_for_public(self, db, auth_user):
        user, _ = auth_user
        seg = make_segment(db)
        public_activity = Activity(
            owner_id=user.id, title="R", sport_type=SportType.RUN, visibility=Visibility.PUBLIC
        )
        db.add(public_activity)
        db.flush()
        db.add(SegmentEffort(
            segment_id=seg.id, activity_id=public_activity.id,
            athlete_id=user.id, elapsed_time=500,
        ))
        db.commit()

        board = get_leaderboard(db, seg.id)
        assert board[0]["activity_id"] == public_activity.id
