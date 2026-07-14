# HopDot MVP Specification

**Status:** Draft v1 — 2026-07-14
**Purpose:** The contract for the MVP. Design and implementation are checked against this document; anything not listed under "In scope" is deferred.

---

## 1. Product summary

HopDot helps runners plan a road-snapped route of a **target distance** (e.g. 8 km) that **passes through places they choose**, starting from a chosen point, as either a loop or point-to-point. The web app is a prototype of the core routing experience ahead of future Garmin integration.

**Persona:** a recreational runner training to a distance plan ("today is an 8 km day") who wants the route to go somewhere interesting — past the river, through the park — rather than a boring out-and-back.

## 2. MVP user stories

1. As a runner, I set a **start point** by clicking the map or searching an address.
2. I add zero or more **must-pass waypoints** the same way, and can drag, reorder, or delete them.
3. I choose **loop** (end = start) or **point-to-point** (separate end point), and set a **target distance** in km.
4. I press **Generate** and get a walking-network-snapped route through all my waypoints whose length is within **±5% of target**, drawn on the map with its actual distance shown.
5. I **export the route as GPX 1.1** (Garmin-importable) or GeoJSON.

## 3. Success criteria

- Generates a valid route within ±5% of target in **< 10 seconds** for targets up to 30 km in a typical suburban road network.
- Route never leaves the pedestrian/walking network (no highways).
- All must-pass waypoints appear on the final route in the given order.
- Exported GPX imports cleanly into Garmin Connect.

## 4. Locked stack decisions

| Decision | Choice | Rationale |
|---|---|---|
| Map display | **Mapbox GL JS** (existing) | Already integrated and working; free tier ample. |
| Route generation | **openrouteservice (ORS)** `foot-walking` profile, free hosted API | Only free API with both multi-waypoint directions **and** built-in `round_trip` generation to a target length. Google Maps was considered and rejected: it has no target-distance or loop-generation capability (we'd still build the whole algorithm ourselves), requires billing setup, and would force replacing the working Mapbox display for no gain. Its walking + waypoints feature is fully covered by ORS. |
| Backend | **FastAPI (Python)**, rebuilt | Hosts the distance-matching algorithm; Python keeps the OSMnx upgrade path (v2). |
| Hosting | **Vercel** (frontend) + **Render** (backend) | Standard fit; backend needs a persistent process. |
| Priority | Distance-matching first, polish second | It is the product differentiator. |

## 5. Route generation design (research findings)

No existing API solves the combined problem — *target distance AND must-pass waypoints* — so the MVP composes two API capabilities with a small custom loop:

**Surveyed options:**
- **ORS `round_trip`**: generates a loop from one point to an approximate length (max 100 km). No via-waypoints. Distance is approximate; typically runs long.
- **GraphHopper `algorithm=round_trip`**: same idea, with `round_trip.distance` and a heading parameter; also single-point only. Fallback provider if ORS quality disappoints.
- **Google Maps Directions/Routes**: walking + ≤25 waypoints, but no distance-targeting of any kind. Rejected (see §4).
- **OSMnx + networkx (self-hosted graph search)**: full control, solves the problem exactly; heavyweight (per-city graph downloads, memory). Reserved for **v2** if API composition can't hit ±5%.

**MVP algorithm (API composition):**
1. Route through `start → waypoints… → end` via ORS directions; measure length `L`.
2. If `L` is within tolerance → done.
3. If short by `Δ`, insert a detour: request an ORS `round_trip` of length `Δ` anchored at the point along the route where the longest leg is, splice it in, re-measure.
4. Iterate (≤ 5 rounds, scaling the requested detour by the observed over/undershoot). If still out of tolerance, return best effort with a clear "9.2 km (target 10 km)" label.
5. If `L` already exceeds target, no shortening is attempted in MVP — the app reports the overshoot and the user removes/moves waypoints.

This lives in the FastAPI backend behind `POST /api/route` so the frontend never talks to ORS directly (keeps the ORS key server-side and lets v2 swap in OSMnx without frontend changes).

## 6. Out of scope for MVP

Accounts and saved routes · elevation profile · Garmin Connect API integration (GPX file export only) · mobile app / Connect IQ · route *shortening* below an over-target waypoint set · cycling profile polish (selector may remain but running/walking is the tested path).

## 7. Known risks

- **ORS round_trip length accuracy varies** — mitigated by the iterative correction loop and honest labelling.
- **ORS free-tier rate limits** — fine for a prototype; GraphHopper is the drop-in fallback, OSMnx the endgame.
- **Sparse road networks** (rural areas) may make ±5% unreachable; best-effort labelling covers this.
