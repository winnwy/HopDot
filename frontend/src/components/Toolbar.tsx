import { useState } from "react";
import CoordinatesDisplay from "./CoordinatesDisplay";
import SearchBoxComponent from "./SearchBoxComponent";
import { Position } from "@/types/map.types";
import mapboxgl from "mapbox-gl";
import { useMapbox } from "@/hooks/useMapbox";

const Toolbar = () => {
  const [startPosition, setStartPosition] = useState<Position | null>(null);
  const [endPosition, setEndPosition] = useState<Position | null>(null);
  const [startValue, setStartValue] = useState("");
  const [endValue, setEndValue] = useState("");
  const { accessToken, mapRef, mapState } = useMapbox();
  //TODO: Instead of using string values, get the location lat, log, to set start and end position.
  const handleStartPositionSelect = (position: Position) => {
  //   setStartPosition(position);
  // };

  // const handleEndPositionSelect = (position: Position) => {
  //   setEndPosition(position);
  // };

  return (
    <>
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
      />{" "}
    </>
  );
};

export default Toolbar;
