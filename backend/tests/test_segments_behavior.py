"""
Behavior tests for segments.

Scenarios:
- User creates a segment, it gets distance auto-calculated
- Running through a segment auto-creates a personal effort
- Leaderboard ranks athletes fastest-first
- Only your best time counts per athlete in the leaderboard
- Running twice improves your leaderboard rank if faster
- Private activity hides the link but still shows your time
- Creating a segment picks up past runs retroactively
- Someone else's efforts don't appear in your personal efforts
- Running a completely different route doesn't create an effort
"""

import pytest
from backend.models.activity import Activity, SportType, Visibility
from backend.models.user import User
from backend.services import auth_service

VONDELPARK = "{cq~Hw{u\\oFrSsI~MoKzE{JcLcB{TzE_SjM_IvLvBrIvQ"
AMSTEL = "_ko~Hsh}\\_NsIcQ{EoP_DoPkCsNkC"


@pytest.fixture
def user_a(db):
    u = User(username="alice", email="alice@test.com", password_hash="x")
    db.add(u)
    db.commit()
    db.refresh(u)
    return u, {"Authorization": f"Bearer {auth_service.create_access_token(u.id)}"}


@pytest.fixture
def user_b(db):
    u = User(username="bob", email="bob@test.com", password_hash="x")
    db.add(u)
    db.commit()
    db.refresh(u)
    return u, {"Authorization": f"Bearer {auth_service.create_access_token(u.id)}"}


class TestSegmentCreation:
    def test_creating_segment_returns_auto_calculated_distance(self, client, user_a):
        _, headers = user_a
        resp = client.post("/api/segments/", json={"name": "Vondelpark Loop", "polyline": VONDELPARK}, headers=headers)
        assert resp.status_code == 200
        assert resp.json()["distance"] > 0

    def test_segment_appears_in_list_after_creation(self, client, user_a):
        _, headers = user_a
        client.post("/api/segments/", json={"name": "My Segment", "polyline": VONDELPARK}, headers=headers)
        resp = client.get("/api/segments/", headers=headers)
        names = [s["name"] for s in resp.json()]
        assert "My Segment" in names

    def test_cannot_create_segment_without_login(self, client):
        resp = client.post("/api/segments/", json={"name": "X", "polyline": VONDELPARK})
        assert resp.status_code == 401


class TestAutoMatching:
    def test_running_through_segment_creates_effort(self, client, user_a):
        _, headers = user_a

        seg = client.post("/api/segments/", json={"name": "Vondelpark", "polyline": VONDELPARK}, headers=headers).json()

        client.post("/api/activities/", json={
            "title": "Morning Run", "sport_type": "run",
            "distance": 2300, "duration": 720, "polyline": VONDELPARK,
        }, headers=headers)

        efforts = client.get(f"/api/segments/{seg['id']}/efforts", headers=headers).json()
        assert len(efforts) == 1
        assert efforts[0]["elapsed_time"] > 0

    def test_effort_time_is_proportional_to_run_duration(self, client, user_a):
        _, headers = user_a

        seg = client.post("/api/segments/", json={"name": "Vondelpark", "polyline": VONDELPARK}, headers=headers).json()

        client.post("/api/activities/", json={
            "title": "Run", "sport_type": "run",
            "distance": seg["distance"],
            "duration": 600,
            "polyline": VONDELPARK,
        }, headers=headers)

        efforts = client.get(f"/api/segments/{seg['id']}/efforts", headers=headers).json()
        assert abs(efforts[0]["elapsed_time"] - 600) <= 5

    def test_running_different_route_creates_no_effort(self, client, user_a):
        _, headers = user_a

        seg = client.post("/api/segments/", json={"name": "Amstel Sprint", "polyline": AMSTEL}, headers=headers).json()

        client.post("/api/activities/", json={
            "title": "Other Run", "sport_type": "run",
            "distance": 2300, "duration": 720, "polyline": VONDELPARK,
        }, headers=headers)

        efforts = client.get(f"/api/segments/{seg['id']}/efforts", headers=headers).json()
        assert len(efforts) == 0

    def test_activity_without_polyline_creates_no_effort(self, client, user_a):
        _, headers = user_a

        seg = client.post("/api/segments/", json={"name": "Vondelpark", "polyline": VONDELPARK}, headers=headers).json()

        client.post("/api/activities/", json={
            "title": "Manual Entry", "sport_type": "run",
            "distance": 2300, "duration": 720,
        }, headers=headers)

        efforts = client.get(f"/api/segments/{seg['id']}/efforts", headers=headers).json()
        assert len(efforts) == 0


class TestLeaderboard:
    def test_faster_athlete_ranks_higher(self, client, user_a, user_b):
        _, headers_a = user_a
        _, headers_b = user_b

        seg = client.post("/api/segments/", json={"name": "Vondelpark", "polyline": VONDELPARK}, headers=headers_a).json()

        client.post("/api/activities/", json={
            "title": "Fast Run", "sport_type": "run",
            "distance": 2300, "duration": 500, "polyline": VONDELPARK, "visibility": "public",
        }, headers=headers_b)

        client.post("/api/activities/", json={
            "title": "Slow Run", "sport_type": "run",
            "distance": 2300, "duration": 800, "polyline": VONDELPARK, "visibility": "public",
        }, headers=headers_a)

        board = client.get(f"/api/segments/{seg['id']}/leaderboard", headers=headers_a).json()
        assert board[0]["rank"] == 1
        assert board[0]["best_time"] < board[1]["best_time"]

    def test_only_best_time_counts_per_athlete(self, client, user_a):
        _, headers = user_a

        seg = client.post("/api/segments/", json={"name": "Vondelpark", "polyline": VONDELPARK}, headers=headers).json()
        seg_dist = seg["distance"]

        client.post("/api/activities/", json={
            "title": "Run 1", "sport_type": "run",
            "distance": seg_dist, "duration": 800, "polyline": VONDELPARK,
        }, headers=headers)
        client.post("/api/activities/", json={
            "title": "Run 2", "sport_type": "run",
            "distance": seg_dist, "duration": 500, "polyline": VONDELPARK,
        }, headers=headers)

        board = client.get(f"/api/segments/{seg['id']}/leaderboard", headers=headers).json()
        my_entries = [e for e in board if e["athlete_name"] == "alice"]
        assert len(my_entries) == 1
        assert my_entries[0]["best_time"] < 800

    def test_private_activity_hides_link_but_shows_time(self, client, user_a):
        _, headers = user_a

        seg = client.post("/api/segments/", json={"name": "Vondelpark", "polyline": VONDELPARK}, headers=headers).json()

        client.post("/api/activities/", json={
            "title": "Secret Run", "sport_type": "run",
            "distance": 2300, "duration": 600, "polyline": VONDELPARK, "visibility": "private",
        }, headers=headers)

        board = client.get(f"/api/segments/{seg['id']}/leaderboard", headers=headers).json()
        my_entry = next(e for e in board if e["athlete_name"] == "alice")
        assert my_entry["best_time"] > 0
        assert my_entry["activity_id"] is None

    def test_public_activity_shows_link(self, client, user_a):
        _, headers = user_a

        seg = client.post("/api/segments/", json={"name": "Vondelpark", "polyline": VONDELPARK}, headers=headers).json()

        client.post("/api/activities/", json={
            "title": "Public Run", "sport_type": "run",
            "distance": 2300, "duration": 600, "polyline": VONDELPARK, "visibility": "public",
        }, headers=headers)

        board = client.get(f"/api/segments/{seg['id']}/leaderboard", headers=headers).json()
        my_entry = next(e for e in board if e["athlete_name"] == "alice")
        assert my_entry["activity_id"] is not None


class TestRetroactiveMatching:
    def test_past_run_appears_after_segment_created(self, client, user_a):
        _, headers = user_a

        client.post("/api/activities/", json={
            "title": "Run before segment", "sport_type": "run",
            "distance": 2300, "duration": 720, "polyline": VONDELPARK,
        }, headers=headers)

        seg = client.post("/api/segments/", json={"name": "Vondelpark", "polyline": VONDELPARK}, headers=headers).json()

        efforts = client.get(f"/api/segments/{seg['id']}/efforts", headers=headers).json()
        assert len(efforts) >= 1

    def test_past_run_appears_in_leaderboard(self, client, user_a):
        _, headers = user_a

        client.post("/api/activities/", json={
            "title": "Run before segment", "sport_type": "run",
            "distance": 2300, "duration": 720, "polyline": VONDELPARK, "visibility": "public",
        }, headers=headers)

        seg = client.post("/api/segments/", json={"name": "Vondelpark", "polyline": VONDELPARK}, headers=headers).json()

        board = client.get(f"/api/segments/{seg['id']}/leaderboard", headers=headers).json()
        assert any(e["athlete_name"] == "alice" for e in board)


class TestPersonalEfforts:
    def test_my_efforts_shows_only_mine(self, client, user_a, user_b):
        _, headers_a = user_a
        _, headers_b = user_b

        seg = client.post("/api/segments/", json={"name": "Vondelpark", "polyline": VONDELPARK}, headers=headers_a).json()

        client.post("/api/activities/", json={
            "title": "Alice Run", "sport_type": "run",
            "distance": 2300, "duration": 600, "polyline": VONDELPARK,
        }, headers=headers_a)
        client.post("/api/activities/", json={
            "title": "Bob Run", "sport_type": "run",
            "distance": 2300, "duration": 500, "polyline": VONDELPARK,
        }, headers=headers_b)

        efforts_a = client.get(f"/api/segments/{seg['id']}/efforts", headers=headers_a).json()
        efforts_b = client.get(f"/api/segments/{seg['id']}/efforts", headers=headers_b).json()

        assert all(e["athlete_id"] != efforts_b[0]["athlete_id"] for e in efforts_a)
        assert len(efforts_a) == 1
        assert len(efforts_b) == 1

    def test_running_twice_shows_two_efforts(self, client, user_a):
        _, headers = user_a

        seg = client.post("/api/segments/", json={"name": "Vondelpark", "polyline": VONDELPARK}, headers=headers).json()

        client.post("/api/activities/", json={
            "title": "Run 1", "sport_type": "run",
            "distance": 2300, "duration": 600, "polyline": VONDELPARK,
        }, headers=headers)
        client.post("/api/activities/", json={
            "title": "Run 2", "sport_type": "run",
            "distance": 2300, "duration": 500, "polyline": VONDELPARK,
        }, headers=headers)

        efforts = client.get(f"/api/segments/{seg['id']}/efforts", headers=headers).json()
        assert len(efforts) == 2
