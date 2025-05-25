"use client";
import { useRef, useEffect } from "react";
import * as mapboxgl from "mapbox-gl";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import { Position } from "@/types/map.types";

interface MapControlsProps {
  map: mapboxgl.Map | null;
  onStartPositionSelect: (position: Position) => void;
  onEndPositionSelect: (Position: Position) => void;
}

const MapControls = ({
  map,
  onStartPositionSelect,
  onEndPositionSelect,
}: MapControlsProps) => {
  const startGeocoderContainerRef = useRef<HTMLDivElement>(null);
  const endGeocoderContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!map) return;

    // Replace with your actual Mapbox access token or use an environment variable
    const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

    // Create start position geocoder
    const startGeocoder = new MapboxGeocoder({
      accessToken: MAPBOX_ACCESS_TOKEN,
      mapboxgl: mapboxgl,
      placeholder: "Search for start location...",
    });
    startGeocoderContainerRef.current?.appendChild(startGeocoder.onAdd(map));

    // Create end position geocoder
    const endGeocoder = new MapboxGeocoder({
      accessToken: MAPBOX_ACCESS_TOKEN,
      mapboxgl: mapboxgl,
      placeholder: "Search for end location...",
    });
    endGeocoderContainerRef.current?.appendChild(endGeocoder.onAdd(map));

    // Handle start geocoder result
    startGeocoder.on("result", (e) => {
      onStartPositionSelect({
        coordinates: [e.result.center[0], e.result.center[1]],
        address: e.result.place_name,
      });
      // Center the map on the start position
      map.flyTo({
        center: [e.result.center[0], e.result.center[1]],
        zoom: 14,
      });
    });

    // Handle end geocoder result
    endGeocoder.on("result", (e) => {
      onEndPositionSelect({
        coordinates: [e.result.center[0], e.result.center[1]],
        address: e.result.place_name,
      });
      // Center the map on the end position
      map.flyTo({
        center: [e.result.center[0], e.result.center[1]],
        zoom: 14,
      });
    });

    // Cleanup function
    return () => {
      [startGeocoderContainerRef, endGeocoderContainerRef].forEach((ref) => {
        if (ref.current && ref.current.firstChild) {
          ref.current.removeChild(ref.current.firstChild);
        }
      });
    };
  }, [map, onStartPositionSelect, onEndPositionSelect]);

  return (
    <div className="flex flex-col md:flex-row gap-2 p-2">
      <div
        ref={startGeocoderContainerRef}
        className="geocoder-container flex-1"
      />
      <div
        ref={endGeocoderContainerRef}
        className="geocoder-container flex-1"
      />
    </div>
  );
};

export default MapControls;
