"use client";
import { useEffect, useState } from "react";
import type { LngLat } from "../types/route.types";

export type PlaceName = { short: string; full: string };

export const placeNameKey = ([lng, lat]: LngLat) =>
  `${lng.toFixed(5)},${lat.toFixed(5)}`;

const keyFor = placeNameKey;

// Module-level cache shared across all hook instances/renders so a point is
// NEVER geocoded twice, even across reorders/drag-releases that recreate
// component state. `null` marks a resolved-but-empty/failed lookup so we
// don't retry it.
const cache = new Map<string, PlaceName | null>();
// In-flight request dedupe, keyed the same way.
const pending = new Map<string, Promise<void>>();

interface GeocodeContextItem {
  id?: string;
  text?: string;
}

interface GeocodeFeature {
  text?: string;
  place_name?: string;
  context?: GeocodeContextItem[];
}

interface GeocodeResponse {
  features?: GeocodeFeature[];
}

async function fetchPlaceName(point: LngLat, key: string): Promise<void> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  if (!token) {
    cache.set(key, null);
    return;
  }

  const [lng, lat] = point;
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&types=poi,address,neighborhood,locality&limit=1`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      cache.set(key, null);
      return;
    }
    const data: GeocodeResponse = await res.json();
    const feature = data.features?.[0];
    if (!feature || !feature.text) {
      cache.set(key, null);
      return;
    }

    const locality = feature.context?.find(
      (c) => typeof c.id === "string" && /^(neighborhood|locality|place)\./.test(c.id)
    )?.text;

    const short = locality ? `${feature.text}, ${locality}` : feature.text;
    const full = feature.place_name ?? short;

    cache.set(key, { short, full });
  } catch {
    // Network error, offline, CORS, etc. — fall back to coordinates, never throw.
    cache.set(key, null);
  }
}

/**
 * Reverse-geocodes a list of points via Mapbox and returns a map of
 * `${lng.toFixed(5)},${lat.toFixed(5)}` -> PlaceName. Results are cached at
 * module scope so a given point is only ever geocoded once, regardless of
 * how many times it's passed back in (reorders, drag releases, remounts).
 */
export function usePlaceNames(
  points: LngLat[]
): Record<string, PlaceName | undefined> {
  const [, forceRender] = useState(0);

  const keys = points.map(keyFor);
  const keysSignature = keys.join("|");

  useEffect(() => {
    let cancelled = false;

    points.forEach((point) => {
      const key = keyFor(point);
      if (cache.has(key) || pending.has(key)) return;

      const promise = fetchPlaceName(point, key).finally(() => {
        pending.delete(key);
        if (!cancelled) forceRender((n) => n + 1);
      });
      pending.set(key, promise);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keysSignature]);

  const result: Record<string, PlaceName | undefined> = {};
  keys.forEach((key) => {
    const entry = cache.get(key);
    result[key] = entry ?? undefined;
  });
  return result;
}
