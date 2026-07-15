"use client";
import { useCallback, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useMapbox } from "../hooks/useMapbox";
import { useMarkers } from "../hooks/useMarkers";
import { useRouteLayer } from "../hooks/useRouteLayer";
import { planToPoints, type RoutePlanDispatch } from "../hooks/useRoutePlan";
import type { GeneratedRoute, LngLat, RoutePlan } from "../types/route.types";

interface MapCanvasProps {
  plan: RoutePlan;
  dispatch: RoutePlanDispatch;
  generatedRoute: GeneratedRoute;
  /** Reports the underlying mapboxgl.Map instance up once created, so
   * sibling components (e.g. PlannerPanel's SearchBox) can use it too. */
  onMapReady?: (map: mapboxgl.Map | null) => void;
}

const MapCanvas = ({ plan, dispatch, generatedRoute, onMapReady }: MapCanvasProps) => {
  const { mapContainerRef, mapRef } = useMapbox();

  const points = planToPoints(plan);

  useEffect(() => {
    onMapReady?.(mapRef);
  }, [mapRef, onMapReady]);

  useEffect(() => {
    if (!mapRef) return;
    const handleClick = (e: mapboxgl.MapMouseEvent) => {
      const point: LngLat = [e.lngLat.lng, e.lngLat.lat];
      dispatch({ type: "addPoint", point });
    };
    mapRef.on("click", handleClick);
    return () => {
      mapRef.off("click", handleClick);
    };
  }, [mapRef, dispatch]);

  const handleMarkerDrag = useCallback(
    (index: number, point: LngLat) => {
      dispatch({ type: "movePoint", index, point });
    },
    [dispatch],
  );

  useMarkers(mapRef, points, handleMarkerDrag);
  useRouteLayer(mapRef, generatedRoute?.geometry ?? null);

  return (
    <div
      ref={mapContainerRef}
      data-testid="map-canvas"
      className="w-full h-full min-h-[400px] bg-gray-300 rounded-md shadow-md"
    />
  );
};

export default MapCanvas;
