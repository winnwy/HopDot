"use client";
import { useCallback, useState } from "react";
import type mapboxgl from "mapbox-gl";
import { useRoutePlan } from "../hooks/useRoutePlan";
import type { GeneratedRoute } from "../types/route.types";
import MapCanvas from "./MapCanvas";
import PlannerPanel from "./PlannerPanel";
import ResultBar from "./ResultBar";

const RunPlanner = () => {
  const [plan, dispatch] = useRoutePlan();
  const [generatedRoute, setGeneratedRoute] = useState<GeneratedRoute>(null);
  const [map, setMap] = useState<mapboxgl.Map | null>(null);

  const handleMapReady = useCallback((m: mapboxgl.Map | null) => setMap(m), []);

  return (
    <div className="flex flex-col h-full gap-3">
      <div className="relative flex flex-1 flex-col md:flex-row gap-3 min-h-0">
        {/* Map: fills the whole planner area behind the panel on mobile
            (via absolute inset-0 in this relative row); normal flex sibling
            on md+ — desktop layout unchanged. */}
        <div className="absolute inset-0 md:relative md:flex-1 md:min-h-[400px]">
          <MapCanvas
            plan={plan}
            dispatch={dispatch}
            generatedRoute={generatedRoute}
            onMapReady={handleMapReady}
          />
        </div>

        {/* Mobile bottom sheet: fixed to the viewport bottom, scrollable,
            with a drag-handle-style top edge. On md+ this reverts to the
            original static side panel (desktop layout unchanged). */}
        <div
          className="fixed inset-x-0 bottom-0 z-10 max-h-[70vh] overflow-y-auto
            rounded-t-2xl bg-white shadow-[0_-4px_16px_rgba(0,0,0,0.15)]
            md:static md:z-auto md:max-h-none md:w-80 md:flex-shrink-0
            md:overflow-visible md:rounded-none md:bg-transparent md:shadow-none"
        >
          <div className="flex justify-center py-2 md:hidden" aria-hidden="true">
            <div className="h-1.5 w-10 rounded-full bg-gray-300" />
          </div>
          <div className="px-3 pb-3 md:p-0">
            <PlannerPanel
              plan={plan}
              dispatch={dispatch}
              map={map}
              onGenerated={setGeneratedRoute}
            />
          </div>
          {/* Mobile-only: surface results inside the scrollable sheet.
              Desktop keeps its own full-width ResultBar below (unchanged). */}
          <div className="px-3 pb-3 md:hidden">
            <ResultBar generatedRoute={generatedRoute} targetKm={plan.targetKm} />
          </div>
        </div>
      </div>
      <div className="hidden md:block">
        <ResultBar generatedRoute={generatedRoute} targetKm={plan.targetKm} />
      </div>
    </div>
  );
};

export default RunPlanner;
