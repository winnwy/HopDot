"use client";
import { download } from "../lib/download";
import { toGpx } from "../lib/gpx";
import type { GeneratedRoute } from "../types/route.types";

interface ResultBarProps {
  generatedRoute: GeneratedRoute;
  targetKm: number;
}

const ResultBar = ({ generatedRoute, targetKm }: ResultBarProps) => {
  const hasRoute = generatedRoute !== null;

  const handleExportGpx = () => {
    if (!generatedRoute) return;
    download("hopdot-route.gpx", "application/gpx+xml", toGpx(generatedRoute.geometry));
  };

  const handleExportGeoJson = () => {
    if (!generatedRoute) return;
    const feature = {
      type: "Feature" as const,
      geometry: generatedRoute.geometry,
      properties: {
        distance_km: generatedRoute.distanceKm,
        target_km: targetKm,
        within_tolerance: generatedRoute.withinTolerance,
      },
    };
    download(
      "hopdot-route.geojson",
      "application/geo+json",
      JSON.stringify(feature, null, 2),
    );
  };

  return (
    <div className="flex flex-col gap-2 p-3 bg-white rounded-md shadow-md">
      <div className="flex items-center gap-4">
        {generatedRoute ? (
          <span className="text-sm" data-testid="result-distance">
            {generatedRoute.distanceKm.toFixed(2)} km of {targetKm} km
            {generatedRoute.withinTolerance ? (
              <span className="ml-2 inline-block bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                ✓ within ±5%
              </span>
            ) : (
              <span className="ml-2 inline-block bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                ⚠ outside ±5%
              </span>
            )}
          </span>
        ) : (
          <span className="text-sm text-gray-400">No route generated yet.</span>
        )}
        <div className="ml-auto flex gap-2">
          <button
            onClick={handleExportGpx}
            disabled={!hasRoute}
            title="Export GPX"
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-1 px-3 rounded"
          >
            Export GPX
          </button>
          <button
            onClick={handleExportGeoJson}
            disabled={!hasRoute}
            title="Export GeoJSON"
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-1 px-3 rounded"
          >
            Export GeoJSON
          </button>
        </div>
      </div>
      {generatedRoute && !generatedRoute.withinTolerance && (
        <p className="text-xs text-amber-700">
          This route did not converge within tolerance — check the notes below.
        </p>
      )}
      {generatedRoute && generatedRoute.warnings.length > 0 && (
        <ul className="text-xs text-gray-500 list-disc list-inside">
          {generatedRoute.warnings.map((w, i) => (
            <li key={i}>{w}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ResultBar;
