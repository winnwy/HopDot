"""Outage-tolerant wrapper: runs the 6 spike cases with outage-tolerant retries.
Kept as a debugging tool. Retries each case up to 4 times, 60-75s between rounds."""
import asyncio, time
import httpx
from models import RouteRequest
from services.ors_client import OrsClient, OrsError
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

MAX_ROUNDS = 4
SLEEP_BETWEEN_ROUNDS = 65

async def main():
    results = {}
    for rnd in range(1, MAX_ROUNDS + 1):
        pending = [i for i in range(len(CASES)) if i not in results]
        if not pending:
            break
        print(f"--- round {rnd}, pending cases: {pending} ---", flush=True)
        eng = OrsEngine(OrsClient())
        for i in pending:
            c = CASES[i]
            try:
                r = await eng.generate(c)
                line = (f"target={c.target_km:>4}km wps={len(c.waypoints)} → "
                        f"{r.distance_km:>6}km  ok={r.within_tolerance} iters={r.iterations}")
                results[i] = line
                print(f"case {i}: {line}", flush=True)
            except OrsError as e:
                print(f"case {i}: ORS error {e.status} (outage noise?) {str(e)[:120]}", flush=True)
                if e.status == 429:
                    await asyncio.sleep(30)
            except (httpx.TimeoutException, httpx.TransportError) as e:
                print(f"case {i}: transport error {type(e).__name__} (outage noise)", flush=True)
            await asyncio.sleep(3)
        await eng.ors.aclose()
        if len(results) < len(CASES) and rnd < MAX_ROUNDS:
            print(f"sleeping {SLEEP_BETWEEN_ROUNDS}s before next round...", flush=True)
            await asyncio.sleep(SLEEP_BETWEEN_ROUNDS)

    print("\n=== FINAL SPIKE TABLE ===")
    for i, c in enumerate(CASES):
        print(results.get(i, f"target={c.target_km:>4}km wps={len(c.waypoints)} → NO RESULT (outage)"))

asyncio.run(main())
