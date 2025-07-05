import { useState } from "react";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import "mapbox-gl/dist/mapbox-gl.css";
import { useMapbox } from "../hooks/useMapbox";
import CoordinatesDisplay from "./CoordinatesDisplay";
import { Position } from "../types/map.types";
import mapboxgl from "mapbox-gl";
import SearchBoxComponent from "./SearchBoxComponent";

const MapDisplay = () => {
  const [startPosition, setStartPosition] = useState<Position | null>(null);
  const [endPosition, setEndPosition] = useState<Position | null>(null);
  const [startValue, setStartValue] = useState("");
  const [endValue, setEndValue] = useState("");

  const { accessToken, mapContainerRef, mapRef, mapState } = useMapbox();

  //TODO: Instead of using string values, get the location lat, log, to set start and end position.
  const handleStartPositionSelect = (position: Position) => {
    setStartPosition(position);
  };

  const handleEndPositionSelect = (position: Position) => {
    setEndPosition(position);
  };

  return (
    <>
      <div className="flex flex-col">
        {/* Coordinates display */}
        <CoordinatesDisplay
          mapState={mapState}
          startPosition={startPosition}
          endPosition={endPosition}
        />
        <SearchBoxComponent
          accessToken={accessToken ?? ""}
          map={mapRef ?? undefined}
          mapboxgl={mapboxgl}
          value={startValue}
          onChange={(d: string) => {
            setStartValue(d);
          }}
          marker
        />
        <SearchBoxComponent
          accessToken={accessToken ?? ""}
          map={mapRef ?? undefined}
          mapboxgl={mapboxgl}
          value={endValue}
          onChange={(d: string) => {
            setEndValue(d);
          }}
          marker
        />
        {/* Map container */}
        <div ref={mapContainerRef} className="bg-gray-300 w-full h-[500px]" />
      </div>
    </>
  );
};

export default MapDisplay;