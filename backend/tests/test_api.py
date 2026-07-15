"""Request-validation contract tests for POST /api/route (no ORS calls made)."""
from fastapi.testclient import TestClient

from app import app

client = TestClient(app)

VALID = {
    "start": [151.2093, -33.8688],
    "waypoints": [],
    "end": None,
    "mode": "loop",
    "target_km": 10.0,
}


def test_p2p_without_end_is_422():
    body = {**VALID, "mode": "p2p", "end": None}
    r = client.post("/api/route", json=body)
    assert r.status_code == 422


def test_more_than_20_waypoints_is_422():
    body = {**VALID, "waypoints": [[151.2, -33.8]] * 21}
    r = client.post("/api/route", json=body)
    assert r.status_code == 422


def test_target_km_zero_is_422():
    body = {**VALID, "target_km": 0}
    r = client.post("/api/route", json=body)
    assert r.status_code == 422


def test_target_km_51_is_422():
    body = {**VALID, "target_km": 51}
    r = client.post("/api/route", json=body)
    assert r.status_code == 422


def test_health_returns_200():
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}
