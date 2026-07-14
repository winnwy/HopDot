import { useReducer, type Dispatch } from "react";
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

// Exported for component prop typing (dispatch is `RoutePlanDispatch`);
// not part of the §4.5 snippet but required to type components cleanly.
export type RoutePlanAction = Action;
export type RoutePlanDispatch = Dispatch<Action>;
