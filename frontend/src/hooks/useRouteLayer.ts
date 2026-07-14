import { useEffect } from "react";
import mapboxgl from "mapbox-gl";
import type { LineString } from "geojson";

const SOURCE_ID = "hopdot-route";

export function useRouteLayer(map: mapboxgl.Map | null, geometry: LineString | null) {
  useEffect(() => {
    if (!map || !map.isStyleLoaded()) return;
    const empty: LineString = { type: "LineString", coordinates: [] };
    const data = {
      type: "Feature" as const, geometry: geometry ?? empty, properties: {},
    };
    const src = map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    if (src) { src.setData(data); return; }
    map.addSource(SOURCE_ID, { type: "geojson", data });
    map.addLayer({
      id: SOURCE_ID, type: "line", source: SOURCE_ID,
      layout: { "line-join": "round", "line-cap": "round" },
      paint: { "line-color": "#f59e42", "line-width": 4 },
    });
  }, [map, geometry]);
}
