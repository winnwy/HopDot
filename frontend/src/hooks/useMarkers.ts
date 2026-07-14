import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import type { LngLat } from "../types/route.types";

export function useMarkers(
  map: mapboxgl.Map | null,
  points: LngLat[],
  onDrag: (index: number, point: LngLat) => void,
) {
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!map) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = points.map((p, i) => {
      const color =
        i === 0 ? "#2ecc71" : i === points.length - 1 && points.length > 1
          ? "#e74c3c" : "#3498db";
      const marker = new mapboxgl.Marker({ color, draggable: true })
        .setLngLat(p).addTo(map);
      marker.on("dragend", () => {
        const ll = marker.getLngLat();
        onDrag(i, [ll.lng, ll.lat]);
      });
      return marker;
    });
    return () => markersRef.current.forEach((m) => m.remove());
  }, [map, points, onDrag]);   // onDrag must be a useCallback in the caller
}
