from models import RouteRequest, RouteResponse
from services.ors_client import OrsClient

MAX_ATTEMPTS = 5

def _within(m: float, target_m: float, tol: float) -> bool:
    return abs(m - target_m) / target_m <= tol

def _anchor_on_longest_leg(coords, segments, user_points):
    """Vertex of `coords` nearest the midpoint of the longest user-leg."""
    if not segments:
        return coords[len(coords) // 2]
    longest = max(range(len(segments)), key=lambda i: segments[i])
    # walk cumulative distance to the midpoint of that segment
    target_d = sum(segments[:longest]) + segments[longest] / 2
    acc, i = 0.0, 0
    for i in range(1, len(coords)):
        a, b = coords[i - 1], coords[i]
        acc += ((a[0]-b[0])**2 + (a[1]-b[1])**2) ** 0.5 * 111_320  # rough meters
        if acc >= target_d:
            break
    return coords[i]

def _splice(base_coords, anchor, loop_coords):
    idx = base_coords.index(anchor) if anchor in base_coords else len(base_coords)//2
    return base_coords[:idx] + loop_coords + base_coords[idx:]

class OrsEngine:
    def __init__(self, client: OrsClient):
        self.ors = client

    async def generate(self, req: RouteRequest) -> RouteResponse:
        target_m = req.target_km * 1000
        tol = req.tolerance

        if req.mode == "loop" and not req.waypoints:
            return await self._pure_round_trip(req, target_m, tol)

        pts = [list(req.start), *[list(w) for w in req.waypoints]]
        pts.append(list(req.start) if req.mode == "loop" else list(req.end))
        base = await self.ors.directions(pts)

        if _within(base["meters"], target_m, tol):
            return self._resp(base["coords"], base["meters"], req, 0, True)
        if base["meters"] > target_m:
            return self._resp(base["coords"], base["meters"], req, 0, False,
                              ["route through waypoints exceeds target; "
                               "remove or move waypoints to shorten"])

        deficit = target_m - base["meters"]
        k, best, best_m = 1.0, base["coords"], base["meters"]
        for attempt in range(1, MAX_ATTEMPTS + 1):
            anchor = _anchor_on_longest_leg(base["coords"], base["segments"], pts)
            loop = await self.ors.round_trip(anchor, deficit * k, seed=attempt)
            total = base["meters"] + loop["meters"]
            coords = _splice(base["coords"], anchor, loop["coords"])
            if abs(total - target_m) < abs(best_m - target_m):
                best, best_m = coords, total
            if _within(total, target_m, tol):
                return self._resp(coords, total, req, attempt, True)
            if loop["meters"] > 0:
                k *= deficit / loop["meters"]
        return self._resp(best, best_m, req, MAX_ATTEMPTS, False,
                          [f"best effort: {best_m/1000:.2f} km "
                           f"(target {req.target_km} km)"])

    async def _pure_round_trip(self, req, target_m, tol) -> RouteResponse:
        k, best, best_m = 1.0, None, float("inf")
        for attempt in range(1, MAX_ATTEMPTS + 1):
            r = await self.ors.round_trip(list(req.start), target_m * k, seed=attempt)
            if best is None or abs(r["meters"] - target_m) < abs(best_m - target_m):
                best, best_m = r["coords"], r["meters"]
            if _within(r["meters"], target_m, tol):
                return self._resp(r["coords"], r["meters"], req, attempt, True)
            if r["meters"] > 0:
                k *= (target_m * k) / r["meters"] / k   # = target_m / r.meters
        return self._resp(best, best_m, req, MAX_ATTEMPTS, False,
                          [f"best effort: {best_m/1000:.2f} km "
                           f"(target {req.target_km} km)"])

    def _resp(self, coords, meters, req, iters, ok, warnings=None) -> RouteResponse:
        return RouteResponse(
            geometry={"type": "LineString", "coordinates": coords},
            distance_km=round(meters / 1000, 3),
            target_km=req.target_km,
            within_tolerance=ok,
            iterations=iters,
            warnings=warnings or [],
        )
