"use client";
import { MapState, LngLat } from "@/types/map.types";

interface CoordinatesDisplayProps {
  mapState: MapState;
  points: LngLat[];
}

// Helper to format coordinates
const formatCoord = (n: number) => n.toFixed(4);

const CoordinatesDisplay = ({ mapState, points }: CoordinatesDisplayProps) => {
  const startPosition = points[0] || null;
  const endPosition = points.length > 1 ? points[points.length - 1] : null;
  const wayPoints =
    points.length > 2 ? points.slice(1, points.length - 1) : null;
  return (
    <div className="bg-amber-100 p-2">
      <div>
        Map Center: {mapState.center[0].toFixed(4)},{" "}
        {mapState.center[1].toFixed(4)} | Zoom: {mapState.zoom.toFixed(2)}
      </div>
      <div>
        Start:{" "}
        {startPosition
          ? `${formatCoord(startPosition[0])}, ${formatCoord(startPosition[1])}`
          : "Not set"}
      </div>
      <div>
        Waypoints:{" "}
        {wayPoints
          ? wayPoints.map((point, index) => (
              <div key={index}>{`${formatCoord(point[0])}, ${formatCoord(
                point[1]
              )}`}</div>
            ))
          : "Not set"}
      </div>
      <div>
        End:{" "}
        {endPosition
          ? `${formatCoord(endPosition[0])}, ${formatCoord(endPosition[1])}`
          : "Not set"}
      </div>
    </div>
  );
};

export default CoordinatesDisplay;
