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
    <div className="flex flex-col h-full">
      {/* Coordinates display */}
      <CoordinatesDisplay
        mapState={mapState}
        startPosition={startPosition}
        endPosition={endPosition}
      />

      {/* Geocoder controls display*/}
      <MapControls
        map={mapRef}
        onStartPositionSelect={handleStartPositionSelect}
        onEndPositionSelect={handleEndPositionSelect}
      />

      {/* Map container */}
      <div ref={mapContainerRef} className="bg-gray-300 w-full flex-1" />
    </div>
  );
};

export default MapDisplay;
