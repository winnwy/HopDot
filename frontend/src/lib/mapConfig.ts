export type MapState = {
  center: [number, number];
  zoom: number;
};

export const MAP_STYLE = "mapbox://styles/mapbox/streets-v12";
// Must remain Sydney per IMPLEMENTATION_PLAN.md §7.
export const INITIAL_CENTER: [number, number] = [151.2093, -33.8688];
export const INITIAL_ZOOM = 10.12;
