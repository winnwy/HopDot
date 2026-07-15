"use client";
import { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import {
  MAP_STYLE,
  INITIAL_CENTER,
  INITIAL_ZOOM,
  MapState,
} from "../lib/mapConfig";

export const useMapbox = () => {
  const [mapState, setMapState] = useState<MapState>({
    center: INITIAL_CENTER,
    zoom: INITIAL_ZOOM,
  });

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Set access token
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

    // Initialize map
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLE,
      center: mapState.center,
      zoom: mapState.zoom,
      preserveDrawingBuffer: true,
    });

    const map = mapRef.current;

    // `mapRef` is a plain ref: mutating it doesn't trigger a re-render, so
    // consumers reading the hook's returned `mapRef.current` (e.g. MapCanvas,
    // which attaches click/drag handlers) would only ever see it once some
    // unrelated state update happened to re-render this hook's caller. That
    // previously only occurred incidentally via the "move" listener below
    // (e.g. once GeolocateControl.trigger() panned the map) — if geolocation
    // permission was denied and the user's first action was a map click, the
    // click handler was never attached. Force one re-render right after
    // construction so the map reference is reliably picked up.
    setMapState((s) => ({ ...s }));

    // Add geolocation control
    const geolocateControl = new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
      showUserHeading: true,
    });
    map.addControl(geolocateControl);

    // Auto-locate user on load
    map.on("load", () => {
      geolocateControl.trigger();
    });

    // Update state on map movement
    map.on("move", () => {
      const center = map.getCenter();
      const zoom = map.getZoom();

      setMapState({
        center: [
          center?.lng ?? INITIAL_CENTER[0],
          center?.lat ?? INITIAL_CENTER[1],
        ],
        zoom: zoom ?? INITIAL_ZOOM,
      });
    });

    // Cleanup function
    return () => {
      map.remove();
    };
  }, []);

  return {
    accessToken:mapboxgl.accessToken,
    mapContainerRef,
    mapRef: mapRef.current,
    mapState,
  };
};
