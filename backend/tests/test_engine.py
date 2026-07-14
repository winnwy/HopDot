"""Unit tests for the distance-matching correction loop. ORS mocked with respx."""
import json

import httpx
import pytest
import respx

from models import RouteRequest
from services.ors_client import OrsClient, ORS_URL
from engine.ors import OrsEngine

START = (151.2093, -33.8688)
WPS = [(151.2153, -33.8712), (151.2201, -33.8650)]


def ors_json(meters, segments=None, coords=None):
    coords = coords or [[151.20, -33.86], [151.21, -33.87], [151.22, -33.86]]
    props = {"summary": {"distance": meters}}
    if segments is not None:
        props["segments"] = [{"distance": s} for s in segments]
    return {
        "features": [
            {"geometry": {"type": "LineString", "coordinates": coords},
             "properties": props}
        ]
    }


def is_round_trip(request) -> bool:
    return "round_trip" in json.loads(request.content).get("options", {})


async def run(req, responder):
    client = OrsClient(api_key="test-key")
    engine = OrsEngine(client)
    with respx.mock:
        respx.post(ORS_URL).mock(side_effect=responder)
        result = await engine.generate(req)
    await client.aclose()
    return result


@pytest.mark.asyncio
async def test_base_route_within_tolerance_zero_iterations():
    req = RouteRequest(start=START, waypoints=WPS, mode="loop", target_km=10.0)

    def responder(request):
        assert not is_round_trip(request)
        return httpx.Response(200, json=ors_json(9800, segments=[3000, 3400, 3400]))

    r = await run(req, responder)
    assert r.within_tolerance is True
    assert r.iterations == 0
    assert r.distance_km == 9.8
    assert r.warnings == []


@pytest.mark.asyncio
async def test_base_route_over_target_returns_waypoint_warning():
    req = RouteRequest(start=START, waypoints=WPS, mode="loop", target_km=5.0)

    def responder(request):
        return httpx.Response(200, json=ors_json(8000, segments=[3000, 2500, 2500]))

    r = await run(req, responder)
    assert r.within_tolerance is False
    assert r.iterations == 0
    assert r.distance_km == 8.0
    assert any("waypoints" in w for w in r.warnings)


@pytest.mark.asyncio
async def test_deficit_converges_on_attempt_two():
    # target 10 km, base 6 km -> deficit 4000 m.
    # attempt 1: round_trip over-delivers 1.4x (5600 m) -> total 11.6 km, out.
    # k corrects to 4000/5600; attempt 2 request ~2857 m, delivered at 1.4x = 4000 m
    # -> total exactly 10 km, within tolerance.
    req = RouteRequest(start=START, waypoints=WPS, mode="loop", target_km=10.0)
    calls = {"round_trips": 0}

    def responder(request):
        if not is_round_trip(request):
            return httpx.Response(200, json=ors_json(6000, segments=[2000, 2000, 2000]))
        calls["round_trips"] += 1
        requested = json.loads(request.content)["options"]["round_trip"]["length"]
        return httpx.Response(200, json=ors_json(requested * 1.4))

    r = await run(req, responder)
    assert r.within_tolerance is True
    assert r.iterations == 2
    assert calls["round_trips"] == 2
    assert abs(r.distance_km - 10.0) / 10.0 <= 0.05


@pytest.mark.asyncio
async def test_never_converges_best_effort_after_five_attempts():
    # round_trip always delivers a tiny 100 m loop -> total never approaches target.
    req = RouteRequest(start=START, waypoints=WPS, mode="loop", target_km=10.0)
    calls = {"round_trips": 0}

    def responder(request):
        if not is_round_trip(request):
            return httpx.Response(200, json=ors_json(6000, segments=[2000, 2000, 2000]))
        calls["round_trips"] += 1
        return httpx.Response(200, json=ors_json(100))

    r = await run(req, responder)
    assert r.within_tolerance is False
    assert r.iterations == 5
    assert calls["round_trips"] == 5
    assert any("best effort" in w for w in r.warnings)


@pytest.mark.asyncio
async def test_pure_round_trip_loop_no_waypoints():
    # attempt 1 over-delivers (6 km for 5 km target), attempt 2 lands within tolerance.
    req = RouteRequest(start=START, mode="loop", target_km=5.0)
    calls = {"round_trips": 0, "directions": 0}

    def responder(request):
        assert is_round_trip(request)  # no directions call on this path
        calls["round_trips"] += 1
        if calls["round_trips"] == 1:
            return httpx.Response(200, json=ors_json(6000))
        return httpx.Response(200, json=ors_json(5100))

    r = await run(req, responder)
    assert r.within_tolerance is True
    assert r.iterations == 2
    assert r.distance_km == 5.1
