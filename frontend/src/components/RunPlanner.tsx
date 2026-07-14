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
      <div className="flex flex-1 flex-col md:flex-row gap-3 min-h-0">
        <div className="flex-1 min-h-[400px]">
          <MapCanvas
            plan={plan}
            dispatch={dispatch}
            generatedRoute={generatedRoute}
            onMapReady={handleMapReady}
          />
        </div>
        <PlannerPanel
          plan={plan}
          dispatch={dispatch}
          map={map}
          onGenerated={setGeneratedRoute}
        />
      </div>
      <ResultBar generatedRoute={generatedRoute} targetKm={plan.targetKm} />
    </div>
  );
};

export default RunPlanner;
