# HopDot MVP Technical Design

**Status:** Draft v1 — 2026-07-14 · Companion to [SPEC.md](./SPEC.md)

---

## 1. Architecture

```
Browser (Next.js on Vercel)
  ├─ Mapbox GL JS ──────────────► Mapbox tiles/search (public token, URL-restricted)
  └─ fetch POST /api/route ────► FastAPI (Render)
                                   └─ openrouteservice API (key server-side)
                                        ├─ /v2/directions/foot-walking   (waypoint routing)
                                        └─ round_trip options            (detour loops)
```

Rules:
- The browser never calls ORS directly — the ORS key stays server-side, and the generation engine can be swapped (GraphHopper fallback, OSMnx v2) without frontend changes.
- Mapbox remains display + geocoding/search only.

## 2. API contract

### `POST /api/route`

Request:
```json
{
  "start":     [151.2093, -33.8688],
  "waypoints": [[151.2153, -33.8712], [151.2201, -33.8650]],
  "end":       null,
  "mode":      "loop",
  "target_km": 10.0,
  "tolerance": 0.05
}
```
- Coordinates are `[lng, lat]` (GeoJSON order, matching Mapbox).
- `end: null` + `mode: "loop"` ⇒ end = start. `mode: "p2p"` requires `end`.
- Limits: ≤ 20 waypoints, `target_km` ≤ 50, request timeout 15 s.

Success `200`:
```json
{
  "geometry": { "type": "LineString", "coordinates": [] },
  "distance_km": 9.87,
  "target_km": 10.0,
  "within_tolerance": true,
  "iterations": 3,
  "warnings": []
}
```
Best-effort results return `200` with `within_tolerance: false` and a warning
(e.g. `"could not extend route beyond 8.4 km in this area"`). Errors: `422`
invalid input, `502` ORS failure, `429` passthrough of ORS rate limiting.

### `GET /api/health` — liveness for Render.

## 3. Backend design (FastAPI)

```
backend/
  app.py            # FastAPI app, CORS (pinned to Vercel origin), routes
  models.py         # Pydantic request/response models
  engine/
    base.py         # RouteEngine protocol: generate(request) -> RouteResult
    ors.py          # ORS implementation (MVP)
  services/ors_client.py   # thin async httpx client, retries, rate-limit surfacing
  tests/
```

### Distance-matching algorithm (engine/ors.py)

```
1. base = ORS directions(start, *waypoints, end)          # snapped route
2. if |base.km - target| / target <= tolerance: return base
3. if base.km > target: return base with warning (no shortening in MVP)
4. deficit = target - base.km
   for attempt in 1..5:
     anchor  = midpoint of the longest leg of current route
     loop    = ORS round_trip(anchor, length = deficit * k)   # k starts 1.0
     route   = splice(loop into current route at anchor)
     k      *= target-vs-actual correction factor
     if within tolerance: return route
5. return best attempt with within_tolerance=false + warning
```

Notes:
- `splice` inserts the loop's coordinates at the nearest point on the base
  route; distance is recomputed from ORS responses, not haversine sums.
- ORS `round_trip` typically over-delivers length; `k` self-corrects per
  attempt (spec §5 risk).
- Deterministic `seed` per attempt so retries explore different loop shapes.

## 4. Frontend design

### State model (single source of truth)

```ts
type RoutePlan = {
  start: LngLat | null;
  waypoints: LngLat[];        // ordered, must-pass
  end: LngLat | null;         // ignored when mode === "loop"
  mode: "loop" | "p2p";
  targetKm: number;
};

type GeneratedRoute = {
  geometry: LineString;
  distanceKm: number;
  withinTolerance: boolean;
  warnings: string[];
} | null;
```

Held in a `useRoutePlan` reducer hook (add/move/remove/reorder point, set mode,
set target, clear). `useRouteLayer` owns exactly one Mapbox source/layer and
updates it via `setData()` — no dynamic source ids.

### Component tree

```
app/page.tsx
└─ RunPlanner
   ├─ MapCanvas          (useMapbox; click-to-add; draggable markers)
   ├─ PlannerPanel
   │  ├─ SearchBox       (Mapbox search → add point)
   │  ├─ PointList       (reorder / delete; start=green, wp=numbered, end=red)
   │  ├─ ModeToggle      (loop / point-to-point)
   │  ├─ TargetDistance  (number input, km)
   │  └─ GenerateButton  (calls /api/route; loading + error states)
   └─ ResultBar          (distance vs target, tolerance badge, GPX/GeoJSON export)
```

### Planner screen layout

```
┌───────────────────────────────────────────────┬──────────────────┐
│                                               │ Search [______]  │
│                                               │ ● Start  Circular│
│                 MAP                           │ ① Riverside Park │
│   (click to add · drag markers to move)       │ ② Harbour Bridge │
│                                               │ Mode  [Loop ▾]   │
│                                               │ Target [10] km   │
│                                               │ [ Generate ]     │
├───────────────────────────────────────────────┴──────────────────┤
│ 9.87 km of 10 km ✓ within 5%          [Export GPX] [GeoJSON]     │
└───────────────────────────────────────────────────────────────────┘
```
Mobile: panel collapses to a bottom sheet; map takes the full viewport.

### GPX export (frontend, pure function)

`toGpx(geometry, name): string` producing GPX 1.1 with one `<trk>`; unit-tested
against Garmin Connect import. GeoJSON export uses proper `Feature` types.

## 5. Testing & deployment

- **Backend:** pytest — unit tests for the correction loop with mocked ORS
  responses; contract tests for `/api/route` validation. Deployed on Render,
  `ORS_API_KEY` + `ALLOWED_ORIGIN` as env vars.
- **Frontend:** unit tests for `toGpx` and the `useRoutePlan` reducer;
  one Playwright smoke test (add 2 points → generate → distance visible).
  Deployed on Vercel, `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` + `NEXT_PUBLIC_API_URL`.
- **CI (GitHub Actions):** lint + typecheck + tests on PR for both packages.

## 6. Implementation milestones

| # | Milestone | Contents |
|---|---|---|
| M0 | Foundation cleanup | Fix marker-effect loop, `preserveDrawingBuffer`, remove Google Maps deps, TS-ify SearchBox, `.env.example` |
| M1 | Planner UX | `useRoutePlan` reducer, PointList, mode toggle, target input, draggable markers |
| M2 | Backend + engine | FastAPI rebuild, ORS client, distance-matching loop, deployed to Render |
| M3 | Wire-up + export | Frontend calls `/api/route`, ResultBar, GPX/GeoJSON export |
| M4 | Hardening | Tests, CI, mobile layout, best-effort messaging |

Each milestone is a PR against `main`; M2 is the only one with real unknowns
(algorithm convergence) and should start with a throwaway spike against the
live ORS API before the production implementation.
