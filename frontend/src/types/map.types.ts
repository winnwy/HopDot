export type Position = {
    coordinates: [number, number];
    address: string;
}

export type MapState = {
    center: [number, number];
    zoom: number;
};

export const MAP_STYLE = "mapbox://styles/mapbox/streets-v12";
export const INITIAL_CENTER: [number, number] = [-74.0242, 40.6941];
export const INITIAL_ZOOM = 10.12;