"use client";
import { useState } from "react";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import "mapbox-gl/dist/mapbox-gl.css";
import { useMapbox } from "../hooks/useMapbox";
import MapControls from "./MapControls";
import CoordinatesDisplay from "./CoordinatesDisplay";
import { Position } from "../types/map.types";

const MapDisplay = () => {
  const [startPosition, setStartPosition] = useState<Position | null>(null);
  const [endPosition, setEndPosition] = useState<Position | null>(null);

  const { mapContainerRef, mapRef, mapState } = useMapbox();

  const handleStartPositionSelect = (position: Position) => {
    setStartPosition(position);
  };

  const handleEndPositionSelect = (position: Position) => {
    setEndPosition(position);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* Overlay container for title and geocoder controls */}
      <div className="absolute top-24 right-8 flex flex-col items-end gap-2 z-50">
        {/* Geocoder controls display below the title */}
        <MapControls
          map={mapRef}
          onStartPositionSelect={handleStartPositionSelect}
          onEndPositionSelect={handleEndPositionSelect}
        />
      </div>

      {/* Map container */}
      <div ref={mapContainerRef} className="bg-gray-300 w-full flex-1" />

      {/* Coordinates display */}
      <div className="fixed bottom-6 left-6 bg-white bg-opacity-90 rounded-lg shadow-lg z-50 p-3 max-w-xs pointer-events-none select-none">
        <CoordinatesDisplay
          mapState={mapState}
          startPosition={startPosition}
          endPosition={endPosition}
        />
      </div>
    </div>
  );
};

export default MapDisplay;
