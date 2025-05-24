"use client";
import { MapState, Position } from "@/types/map.types";

interface CoordinatesDisplayProps {
  mapState: MapState;
  startPosition: Position | null;
  endPosition: Position | null;
}

const CoordinatesDisplay = ({
  mapState,
  startPosition,
  endPosition,
}: CoordinatesDisplayProps) => {
  return (
    <div className="bg-amber-100 p-2">
      <div>
        Map Center: {mapState.center[0].toFixed(4)},{" "}
        {mapState.center[1].toFixed(4)} | Zoom: {mapState.zoom.toFixed(2)}
      </div>
      {startPosition && (
        <div>
          Start: {startPosition.coordinates[0].toFixed(4)},{" "}
          {startPosition.coordinates[1].toFixed(4)} - {startPosition.address}
        </div>
      )}
      {endPosition && (
        <div>
          End: {endPosition.coordinates[0].toFixed(4)},{" "}
          {endPosition.coordinates[1].toFixed(4)} - {endPosition.address}
        </div>
      )}
    </div>
  );
};

export default CoordinatesDisplay;
