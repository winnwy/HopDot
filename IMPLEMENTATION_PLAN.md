# HopDot MVP — Implementation Plan (Executor Handbook)

**Status:** v1 — 2026-07-14 · Companion to [SPEC.md](./SPEC.md) and [DESIGN.md](./DESIGN.md)
**Audience:** implementation agents/developers executing milestone by milestone.
Follow this document literally. If reality contradicts it (API changed, dependency broken), STOP and report — do not improvise around the contract.

---

## 0. Ground rules for executors

- One milestone = one branch = one PR against `main`. Branch names: `m0-cleanup`, `m1-planner-ux`, `m2-backend-engine`, `m3-wireup-export`, `m4-hardening`.
- Do not add dependencies beyond those listed in this document.
- Do not restructure files beyond the trees in §2. Do not "improve" unrelated code.
- Every PR must pass: `npm run lint && npm run build` (frontend), `pytest` (backend, from M2).
- Coordinates are ALWAYS `[lng, lat]` arrays end-to-end (GeoJSON order). GPX is the only place lat comes first — inside `toGpx` only.
- Secrets: never commit `.env`. `ORS_API_KEY` lives only on the backend. `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` is the only frontend env secret (public token, URL-restricted in the Mapbox dashboard).

---

## 1. APIs and algorithm

### 1.1 openrouteservice (ORS) — route generation

- Sign up at https://openrouteservice.org/dev → free API key. Free tier ≈ 40 req/min, 2,000 req/day (verify in dashboard).
- Single endpoint used for both operations:
  `POST https://api.openrouteservice.org/v2/directions/foot-walking/geojson`
  Headers: `Authorization: <ORS_API_KEY>`, `Content-Type: application/json`.

**A. Waypoint routing** (start → waypoints… → end):
```json
{ "coordinates": [[151.2093,-33.8688],[151.2153,-33.8712],[151.2201,-33.8650]] }
```

**B. Round-trip loop** (single anchor point, target length in METERS):
```json
{
  "coordinates": [[151.2093,-33.8688]],
  "options": { "round_trip": { "length": 4000, "points": 4, "seed": 1 } }
}
```

Response (both): GeoJSON `FeatureCollection`; use `features[0].geometry`
(LineString) and `features[0].properties.summary.distance` (meters).

### 1.2 Mapbox — display and search only

Existing integration stays: map tiles, geocoding search box, markers. Mapbox
Directions API usage is REMOVED in M3 (generation moves to the backend).

### 1.3 Distance-matching algorithm (backend, `engine/ors.py`)

```
generate(req):
  tol = req.tolerance (default 0.05); target = req.target_km * 1000  # meters

  # Case 1: loop with no waypoints → pure round_trip with correction
  if req.mode == "loop" and not req.waypoints:
      k = 1.0
      for attempt in 1..5:
          route = ors.round_trip(req.start, length=target*k, seed=attempt)
          if within_tol(route.m, target, tol): return ok(route)
          k *= (target*k) / route.m          # proportional correction
      return best_effort(closest attempt)

  # Case 2: waypoints (loop or p2p)
  coords = [start, *waypoints] + ([start] if loop else [end])
  base = ors.directions(coords)
  if within_tol(base.m, target, tol): return ok(base)
  if base.m > target: return warn(base, "route exceeds target; remove/move waypoints")

  deficit = target - base.m
  k = 1.0; best = base
  for attempt in 1..5:
      anchor = midpoint_vertex_of_longest_leg(base)   # a coordinate ON base geometry
      loop_ = ors.round_trip(anchor, length=deficit*k, seed=attempt)
      total_m = base.m + loop_.m        # loop starts+ends at anchor ⇒ exact sum
      if within_tol(total_m, target, tol):
          return ok(splice(base, loop_, anchor), total_m)
      k *= deficit / loop_.m            # correct for ORS over/under-delivery
      best = closest_so_far(...)
  return best_effort(best)
```

- `splice`: find index of `anchor` in base coordinates, insert the loop's
  coordinates at that index. No re-measuring — distances come from ORS sums.
- `within_tol(m, target, tol)`: `abs(m - target) / target <= tol`.
- Legs = segments between consecutive user points; ORS returns per-segment
  distances in `properties.segments[i].distance` — use the longest segment,
  then pick the geometry vertex closest to that segment's midpoint distance.

---

## 2. Project structure (target state after M4)

```
backend/
  app.py                  # FastAPI app + CORS + routes (replaces broken file)
  models.py               # Pydantic request/response models
  engine/
    __init__.py
    base.py               # RouteEngine protocol
    ors.py                # ORS engine (algorithm above)
  services/
    __init__.py
    ors_client.py         # httpx async client, retries
  tests/
    test_engine.py        # mocked-ORS unit tests for the correction loop
    test_api.py           # request validation contract tests
  requirements.txt        # fastapi, uvicorn, httpx, pydantic, pytest, pytest-asyncio, respx
  .env.example            # ORS_API_KEY=, ALLOWED_ORIGIN=http://localhost:3000
  render.yaml
  # DELETE: main.py, Route.py (stubs, superseded)

frontend/src/
  app/page.tsx, layout.tsx, globals.css
  components/
    RunPlanner.tsx        # composition root (client component)
    MapCanvas.tsx         # map div + click-to-add + markers
    PlannerPanel/
      index.tsx  SearchBox.tsx  PointList.tsx  ModeToggle.tsx
      TargetDistance.tsx  GenerateButton.tsx
    ResultBar.tsx         # distance vs target, badge, export buttons
  hooks/
    useMapbox.ts          # existing, + preserveDrawingBuffer fix
    useRoutePlan.ts       # reducer (single source of truth)
    useRouteLayer.ts      # ONE stable source/layer, setData() updates
    useMarkers.ts         # marker lifecycle via useRef (fixes render loop)
  lib/
    api.ts                # generateRoute() → POST /api/route
    gpx.ts                # toGpx()
    download.ts           # blob download helper
  types/route.types.ts
  # DELETE in M1: components/MapDisplay.tsx, CoordinatesDisplay.tsx,
  #               SearchBoxComponent.js (superseded by the tree above)
```

---

## 3. Milestones with tasks and acceptance criteria

### M0 — Foundation cleanup (frontend)
1. `npm uninstall @vis.gl/react-google-maps @googlemaps/markerclusterer next-intl` (English-only MVP; i18n deliberately removed)
2. In `useMapbox.ts`, add `preserveDrawingBuffer: true` to the `new mapboxgl.Map({...})` options.
3. Fix the marker infinite loop: markers move to `useMarkers.ts` (snippet §4.6) — instances held in a `useRef`, effect depends only on `points`; remove all `console.log` debug lines.
4. Fix GeoJSON export: features must be `"type": "Feature"`.
5. Add `frontend/.env.example` with `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=` and `NEXT_PUBLIC_API_URL=http://localhost:8000`.
**Accept:** `npm run build` clean; clicking the map many times adds markers with no console errors and no render-loop; exported GeoJSON validates at geojson.io.

### M1 — Planner UX (frontend)
1. Create `types/route.types.ts`, `hooks/useRoutePlan.ts` (§4.5), `hooks/useRouteLayer.ts` (§4.7), `useMarkers.ts` (§4.6).
2. Build the component tree of §2; delete `MapDisplay.tsx`, `CoordinatesDisplay.tsx`, `SearchBoxComponent.js`. Port the search box into `PlannerPanel/SearchBox.tsx` as TypeScript using `@mapbox/search-js-react`.
3. Interactions: first added point = start; subsequent = waypoints; in p2p mode a "Set end" toggle makes the next click the end point. Markers draggable (`draggable: true`, `dragend` dispatches `movePoint`). PointList supports delete and up/down reorder buttons (no drag-n-drop library).
4. Generate button is present but calls a stub returning the straight-line route (real API in M3).
**Accept:** can compose start + 3 waypoints via click AND search, reorder, delete, drag markers, toggle loop/p2p, set target km; state survives all operations without map flicker; build clean.

### M2 — Backend + engine (backend only; independent of M0/M1)
1. Delete `main.py`, `Route.py`. Build the tree of §2 with snippets §4.1–4.4.
2. `requirements.txt` exactly: `fastapi`, `uvicorn[standard]`, `httpx`, `pydantic>=2`, `pytest`, `pytest-asyncio`, `respx`.
3. FIRST: run the spike script (§5.1) against live ORS with a real key; record convergence results for 5/10/20 km loop + waypoint cases in the PR description. If ±5% is unreachable in ≥2 of 6 cases after 5 iterations, STOP and report before building more.
4. Implement engine + API; tests per §5.2 (ORS mocked with `respx`, no live calls in CI).
**Accept:** `pytest` green; `uvicorn app:app` + curl of §2 request shapes returns contract-conformant JSON; `/api/health` returns 200.

### M3 — Wire-up + export (frontend)
1. `lib/api.ts` (§4.8) replaces the M1 stub; loading spinner on Generate; error toast on 4xx/5xx; ResultBar shows `distance_km` vs `target_km` + tolerance badge + warnings.
2. Remove the old Mapbox Directions fetch entirely.
3. `lib/gpx.ts` (§4.9) + `download.ts`; Export GPX / Export GeoJSON buttons in ResultBar.
**Accept:** full happy path against local backend: 2 clicks + target 5 km → route renders, distance shown; GPX file imports into Garmin Connect (manual check by maintainer, note in PR).

### M4 — Hardening
1. Frontend tests: `npm i -D vitest @testing-library/react jsdom` — unit tests for `toGpx` and the `useRoutePlan` reducer. Playwright: one smoke test (mock `/api/route` with `page.route()`; add 2 points, generate, expect distance text).
2. CI workflow (§6.3).
3. Mobile: `PlannerPanel` becomes a bottom sheet under `md:` breakpoint (CSS only, no library).
4. Best-effort UX: `within_tolerance:false` renders an amber badge with the warning text.
**Accept:** CI green on PR; Lighthouse mobile usability has no layout overflow; all M0–M3 acceptance still passes.

---

## 4. Code snippets (canonical — copy these)

### 4.1 `backend/models.py`
```python
from typing import Literal, Optional
from pydantic import BaseModel, Field, model_validator

LngLat = tuple[float, float]

class RouteRequest(BaseModel):
    start: LngLat
    waypoints: list[LngLat] = Field(default_factory=list, max_length=20)
    end: Optional[LngLat] = None
    mode: Literal["loop", "p2p"]
    target_km: float = Field(gt=0, le=50)
    tolerance: float = Field(default=0.05, gt=0, le=0.5)

    @model_validator(mode="after")
    def check_end(self):
        if self.mode == "p2p" and self.end is None:
            raise ValueError("mode 'p2p' requires 'end'")
        return self

class RouteResponse(BaseModel):
    geometry: dict                 # GeoJSON LineString
    distance_km: float
    target_km: float
    within_tolerance: bool
    iterations: int
    warnings: list[str] = Field(default_factory=list)
```

### 4.2 `backend/services/ors_client.py`
```python
import os
import httpx

ORS_URL = "https://api.openrouteservice.org/v2/directions/foot-walking/geojson"

class OrsError(Exception):
    def __init__(self, status: int, detail: str):
        self.status = status
        super().__init__(f"ORS {status}: {detail}")

class OrsClient:
    def __init__(self, api_key: str | None = None):
        self._key = api_key or os.environ["ORS_API_KEY"]
        self._http = httpx.AsyncClient(timeout=12.0)

    async def _post(self, body: dict) -> dict:
        r = await self._http.post(
            ORS_URL, json=body,
            headers={"Authorization": self._key},
        )
        if r.status_code != 200:
            raise OrsError(r.status_code, r.text[:300])
        feat = r.json()["features"][0]
        return {
            "coords": feat["geometry"]["coordinates"],          # [[lng,lat],...]
            "meters": feat["properties"]["summary"]["distance"],
            "segments": [s["distance"] for s in feat["properties"].get("segments", [])],
        }

    async def directions(self, coordinates: list[list[float]]) -> dict:
        return await self._post({"coordinates": coordinates})

    async def round_trip(self, anchor: list[float], length_m: float, seed: int) -> dict:
        return await self._post({
            "coordinates": [anchor],
            "options": {"round_trip": {
                "length": max(200, round(length_m)), "points": 4, "seed": seed,
            }},
        })

    async def aclose(self):
        await self._http.aclose()
```

### 4.3 `backend/engine/ors.py`
```python
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
```

### 4.4 `backend/app.py`
```python
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from models import RouteRequest, RouteResponse
from services.ors_client import OrsClient, OrsError
from engine.ors import OrsEngine

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.engine = OrsEngine(OrsClient())
    yield
    await app.state.engine.ors.aclose()

app = FastAPI(title="HopDot API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.environ.get("ALLOWED_ORIGIN", "http://localhost:3000")],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health():
    return {"status": "ok"}

@app.post("/api/route", response_model=RouteResponse)
async def create_route(req: RouteRequest):
    try:
        return await app.state.engine.generate(req)
    except OrsError as e:
        raise HTTPException(status_code=429 if e.status == 429 else 502,
                            detail=str(e))
```

### 4.5 `frontend/src/hooks/useRoutePlan.ts`
```ts
import { useReducer } from "react";
import type { LngLat, RoutePlan } from "../types/route.types";

type Action =
  | { type: "addPoint"; point: LngLat }
  | { type: "movePoint"; index: number; point: LngLat }   // index over [start,...wps,end?]
  | { type: "removePoint"; index: number }
  | { type: "reorderWaypoint"; from: number; to: number } // waypoint indices
  | { type: "setMode"; mode: "loop" | "p2p" }
  | { type: "setTargetKm"; km: number }
  | { type: "setEndNext" }        // p2p: next added point becomes end
  | { type: "clear" };

export const initialPlan: RoutePlan = {
  start: null, waypoints: [], end: null, mode: "loop", targetKm: 5, endNext: false,
};

export function planToPoints(p: RoutePlan): LngLat[] {
  return [
    ...(p.start ? [p.start] : []),
    ...p.waypoints,
    ...(p.mode === "p2p" && p.end ? [p.end] : []),
  ];
}

function reducer(s: RoutePlan, a: Action): RoutePlan {
  switch (a.type) {
    case "addPoint":
      if (!s.start) return { ...s, start: a.point };
      if (s.mode === "p2p" && s.endNext) return { ...s, end: a.point, endNext: false };
      return { ...s, waypoints: [...s.waypoints, a.point] };
    case "movePoint": {
      const pts = planToPoints(s);
      if (a.index === 0) return { ...s, start: a.point };
      if (s.mode === "p2p" && s.end && a.index === pts.length - 1)
        return { ...s, end: a.point };
      const wps = [...s.waypoints]; wps[a.index - 1] = a.point;
      return { ...s, waypoints: wps };
    }
    case "removePoint": {
      const pts = planToPoints(s);
      if (a.index === 0) return { ...s, start: s.waypoints[0] ?? null,
                                   waypoints: s.waypoints.slice(1) };
      if (s.mode === "p2p" && s.end && a.index === pts.length - 1)
        return { ...s, end: null };
      return { ...s, waypoints: s.waypoints.filter((_, i) => i !== a.index - 1) };
    }
    case "reorderWaypoint": {
      const wps = [...s.waypoints];
      const [m] = wps.splice(a.from, 1); wps.splice(a.to, 0, m);
      return { ...s, waypoints: wps };
    }
    case "setMode":     return { ...s, mode: a.mode, end: a.mode === "loop" ? null : s.end };
    case "setTargetKm": return { ...s, targetKm: a.km };
    case "setEndNext":  return { ...s, endNext: true };
    case "clear":       return initialPlan;
  }
}

export const useRoutePlan = () => useReducer(reducer, initialPlan);
```

### 4.6 `frontend/src/hooks/useMarkers.ts` (fixes the M0 render loop)
```ts
import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import type { LngLat } from "../types/route.types";

export function useMarkers(
  map: mapboxgl.Map | null,
  points: LngLat[],
  onDrag: (index: number, point: LngLat) => void,
) {
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!map) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = points.map((p, i) => {
      const color =
        i === 0 ? "#2ecc71" : i === points.length - 1 && points.length > 1
          ? "#e74c3c" : "#3498db";
      const marker = new mapboxgl.Marker({ color, draggable: true })
        .setLngLat(p).addTo(map);
      marker.on("dragend", () => {
        const ll = marker.getLngLat();
        onDrag(i, [ll.lng, ll.lat]);
      });
      return marker;
    });
    return () => markersRef.current.forEach((m) => m.remove());
  }, [map, points, onDrag]);   // onDrag must be a useCallback in the caller
}
```

### 4.7 `frontend/src/hooks/useRouteLayer.ts`
```ts
import { useEffect } from "react";
import mapboxgl from "mapbox-gl";
import type { LineString } from "geojson";

const SOURCE_ID = "hopdot-route";

export function useRouteLayer(map: mapboxgl.Map | null, geometry: LineString | null) {
  useEffect(() => {
    if (!map || !map.isStyleLoaded()) return;
    const empty: LineString = { type: "LineString", coordinates: [] };
    const data = {
      type: "Feature" as const, geometry: geometry ?? empty, properties: {},
    };
    const src = map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    if (src) { src.setData(data); return; }
    map.addSource(SOURCE_ID, { type: "geojson", data });
    map.addLayer({
      id: SOURCE_ID, type: "line", source: SOURCE_ID,
      layout: { "line-join": "round", "line-cap": "round" },
      paint: { "line-color": "#f59e42", "line-width": 4 },
    });
  }, [map, geometry]);
}
```

### 4.8 `frontend/src/lib/api.ts`
```ts
import type { RoutePlan, GeneratedRoute } from "../types/route.types";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function generateRoute(plan: RoutePlan): Promise<GeneratedRoute> {
  const res = await fetch(`${API}/api/route`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      start: plan.start,
      waypoints: plan.waypoints,
      end: plan.mode === "p2p" ? plan.end : null,
      mode: plan.mode,
      target_km: plan.targetKm,
    }),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(res.status === 429
      ? "Route service is rate-limited — try again in a minute."
      : `Route generation failed (${res.status}): ${detail.slice(0, 200)}`);
  }
  const d = await res.json();
  return {
    geometry: d.geometry,
    distanceKm: d.distance_km,
    withinTolerance: d.within_tolerance,
    warnings: d.warnings,
  };
}
```

### 4.9 `frontend/src/lib/gpx.ts`
```ts
import type { LineString } from "geojson";

export function toGpx(geometry: LineString, name = "HopDot Route"): string {
  const trkpts = geometry.coordinates
    .map(([lng, lat]) => `      <trkpt lat="${lat}" lon="${lng}"></trkpt>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="HopDot" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata><name>${name}</name></metadata>
  <trk><name>${name}</name><trkseg>
${trkpts}
  </trkseg></trk>
</gpx>`;
}
```

---

## 5. Testing

### 5.1 M2 spike script — `backend/spike_ors.py` (run once, then keep for debugging; not in CI)
```python
"""Usage: ORS_API_KEY=... python spike_ors.py
Prints convergence for 6 cases; paste output into the M2 PR description."""
import asyncio, os
from models import RouteRequest
from services.ors_client import OrsClient
from engine.ors import OrsEngine

CASES = [
    RouteRequest(start=(151.2093, -33.8688), mode="loop", target_km=k)
    for k in (5, 10, 20)
] + [
    RouteRequest(start=(151.2093, -33.8688),
                 waypoints=[(151.2153, -33.8712), (151.2201, -33.8650)],
                 mode="loop", target_km=k)
    for k in (5, 10, 20)
]

async def main():
    eng = OrsEngine(OrsClient())
    for c in CASES:
        r = await eng.generate(c)
        print(f"target={c.target_km:>4}km wps={len(c.waypoints)} → "
              f"{r.distance_km:>6}km  ok={r.within_tolerance} iters={r.iterations}")
    await eng.ors.aclose()

asyncio.run(main())
```

### 5.2 Backend unit tests — mock ORS with `respx`; no live calls in CI.
Required cases in `tests/test_engine.py`:
- base route already within tolerance → 0 iterations
- base route over target → `within_tolerance=false` + waypoint warning
- deficit converges on attempt 2 (mock round_trip over-delivering 1.4×, then correct)
- never converges → best-effort response after 5 attempts, warning present
- pure round-trip loop (no waypoints) path
`tests/test_api.py`: p2p without end → 422; >20 waypoints → 422; target_km 0 / 51 → 422.

### 5.3 Frontend — vitest for `toGpx` (valid XML, lat/lon swapped correctly, coordinate count) and the reducer (add/move/remove/reorder/mode-switch edge cases: removing start promotes first waypoint). Playwright smoke test mocks `/api/route` via `page.route()`.

---

## 6. Deployment

### 6.1 Backend — Render **free tier** (`backend/render.yaml`)

Decision: free tier is accepted for the MVP — the service spins down when idle
and the first request after ~15 min takes 30–60 s to cold-start. The frontend
must therefore show a patient loading state on Generate (M3) rather than a
short timeout: keep the client-side fetch timeout ≥ 90 s.
```yaml
services:
  - type: web
    name: hopdot-api
    runtime: python
    rootDir: backend
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn app:app --host 0.0.0.0 --port $PORT
    healthCheckPath: /api/health
    envVars:
      - key: ORS_API_KEY
        sync: false          # set in Render dashboard
      - key: ALLOWED_ORIGIN
        value: https://<your-vercel-app>.vercel.app
```

### 6.2 Frontend — Vercel: root directory `frontend/`, framework Next.js (auto). Env vars: `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`, `NEXT_PUBLIC_API_URL=https://hopdot-api.onrender.com`. Restrict the Mapbox token to the Vercel domain + localhost in the Mapbox dashboard.

### 6.3 CI — `.github/workflows/ci.yml` (replaces existing experimental workflows)
```yaml
name: CI
on:
  pull_request:
  push: { branches: [main] }
jobs:
  frontend:
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: frontend } }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm, cache-dependency-path: frontend/package-lock.json }
      - run: npm ci
      - run: npm run lint
      - run: npm run build
      - run: npx vitest run --if-present
  backend:
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: backend } }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: "3.12" }
      - run: pip install -r requirements.txt
      - run: pytest
```

---

## 7. Execution order and handoff notes

Locked decisions (2026-07-14, confirmed by the maintainer):
- All milestone branches start from `main`; local `dev-mapdisplay` edits are superseded.
- Default map fallback center and spike test coordinates: Sydney.
- `next-intl` removed in M0 — English-only MVP.
- Backend on Render **free tier** (cold starts accepted; see §6.1).

- M0 and M2 are independent — they can run as parallel agents. M1 depends on M0; M3 depends on M1 + M2; M4 depends on M3.
- M2's spike (§5.1) is the go/no-go gate for the whole algorithm approach. Run it before writing engine tests.
- `types/route.types.ts` must define: `LngLat = [number, number]`, `RoutePlan` (§4.5 shape incl. `endNext: boolean`), `GeneratedRoute` (§4.8 shape). Keep field names exactly as in the snippets — backend uses snake_case on the wire, frontend camelCase internally; `lib/api.ts` is the only translation point.
- Anything ambiguous: SPEC.md wins over DESIGN.md wins over this file's prose; the code snippets here win over all prose.
