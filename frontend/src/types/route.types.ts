import type { LineString } from "geojson";

export type LngLat = [number, number];

export type RoutePlan = {
  start: LngLat | null;
  waypoints: LngLat[]; // ordered, must-pass
  end: LngLat | null; // ignored when mode === "loop"
  mode: "loop" | "p2p";
  targetKm: number;
  endNext: boolean; // p2p: next added point becomes end
};

export type GeneratedRoute = {
  geometry: LineString;
  distanceKm: number;
  withinTolerance: boolean;
  warnings: string[];
} | null;
