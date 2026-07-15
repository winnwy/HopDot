import type { RoutePlan, GeneratedRoute } from "../types/route.types";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// Locked decision (§6.1 IMPLEMENTATION_PLAN.md): the backend runs on Render's
// free tier, which cold-starts in 30-60s after idling. The client-side fetch
// timeout must tolerate >= 90s so a cold start doesn't look like a failure.
const FETCH_TIMEOUT_MS = 90_000;

export async function generateRoute(plan: RoutePlan): Promise<GeneratedRoute> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${API}/api/route`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        start: plan.start,
        waypoints: plan.waypoints,
        end: plan.mode === "p2p" ? plan.end : null,
        mode: plan.mode,
        target_km: plan.targetKm,
      }),
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error(
        "The route service is waking up — try again in a minute.",
      );
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

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
