export type Position = {
  coordinates: [number, number];
  address: string;
};

export type LngLat = [number, number];

export type MapState = {
  center: [number, number];
  zoom: number;
};

export const MAP_STYLE = "mapbox://styles/mapbox/streets-v12";
export const INITIAL_CENTER: [number, number] = [151.2093, -33.8688];
export const INITIAL_ZOOM = 10.12;
