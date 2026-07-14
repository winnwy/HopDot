"use client";
import type { GeneratedRoute } from "../types/route.types";

interface ResultBarProps {
  generatedRoute: GeneratedRoute;
  targetKm: number;
}

const ResultBar = ({ generatedRoute, targetKm }: ResultBarProps) => {
  return (
    <div className="flex items-center gap-4 p-3 bg-white rounded-md shadow-md">
      {generatedRoute ? (
        <span className="text-sm">
          {generatedRoute.distanceKm.toFixed(2)} km of {targetKm} km
          {generatedRoute.withinTolerance ? (
            <span className="ml-2 text-green-600">✓ within tolerance</span>
          ) : (
            <span className="ml-2 text-amber-600">
              ⚠ {generatedRoute.warnings[0] ?? "outside tolerance"}
            </span>
          )}
        </span>
      ) : (
        <span className="text-sm text-gray-400">No route generated yet.</span>
      )}
      <div className="ml-auto flex gap-2">
        {/* Export wiring lands in M3 (lib/gpx.ts + download.ts). */}
        <button
          disabled
          title="Export GPX (available in M3)"
          className="bg-gray-300 text-white font-bold py-1 px-3 rounded cursor-not-allowed"
        >
          Export GPX
        </button>
        <button
          disabled
          title="Export GeoJSON (available in M3)"
          className="bg-gray-300 text-white font-bold py-1 px-3 rounded cursor-not-allowed"
        >
          Export GeoJSON
        </button>
      </div>
    </div>
  );
};

export default ResultBar;
