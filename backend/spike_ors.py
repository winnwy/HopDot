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
