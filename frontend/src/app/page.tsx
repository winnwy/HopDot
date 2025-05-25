"use client";
import { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";

import 'mapbox-gl/dist/mapbox-gl.css';

const MAP_STYLE = "mapbox://styles/mapbox/streets-v12";
const INITIAL_CENTER: [number, number] = [151.2064, -33.8840]; // For now Sydney City, in the future something else.
const INITIAL_ZOOM = 5;

const MapDisplay = () => {
  const [mapState, setMapState] = useState({
    center: INITIAL_CENTER,
    zoom: INITIAL_ZOOM,
  });

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  // Initialize map and controls
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
    });

    // Add controls and event listeners
    const setupMapControls = () => {
      if (!mapRef.current) return;

      // Add geolocation control
      const geolocateControl = new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true,
      });
      mapRef.current.addControl(geolocateControl);

      // // Auto-locate user on load
      mapRef.current.on("load", () => {
        geolocateControl.trigger();
      });

      // Update state on map movement
      mapRef.current.on("move", () => {
        const center = mapRef.current?.getCenter();
        const zoom = mapRef.current?.getZoom();

        setMapState({
          center: [
            center?.lng ?? INITIAL_CENTER[0],
            center?.lat ?? INITIAL_CENTER[1],
          ],
          zoom: zoom ?? INITIAL_ZOOM,
        });
      });
    };

    setupMapControls();

    // Cleanup function
    return () => {
      mapRef.current?.remove();
    };
  }, [mapState.center, mapState.zoom]);

  return (
    <div className="flex flex-col h-screen">
      <div className="bg-amber-100 p-2">
        Longitude: {mapState.center[0].toFixed(4)} | Latitude:{" "}
        {mapState.center[1].toFixed(4)} | Zoom: {mapState.zoom.toFixed(2)}
      </div>
      <div ref={mapContainerRef} className="bg-gray-300 w-full h-full" /> 
      {/* original h-500px */}
    </div>
  );
};

export default MapDisplay;
