import type { LngLat } from "../types/route.types";

const EARTH_RADIUS_M = 6_371_000;

/** Great-circle distance between two [lng, lat] points, in meters. */
function haversineMeters(a: LngLat, b: LngLat): number {
  const [lng1, lat1] = a;
  const [lng2, lat2] = b;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

/**
 * Straight-line (haversine) distance in km through an ordered list of points.
 * STUB for M1 — replaced by the real road-network distance from the backend
 * in M3. Do not use this for anything beyond the M1 Generate-button preview.
 */
export function haversineRouteKm(points: LngLat[]): number {
  let totalM = 0;
  for (let i = 1; i < points.length; i++) {
    totalM += haversineMeters(points[i - 1], points[i]);
  }
  return totalM / 1000;
}
