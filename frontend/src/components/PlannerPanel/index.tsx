"use client";
import mapboxgl from "mapbox-gl";
import type { RoutePlanDispatch } from "../../hooks/useRoutePlan";
import type { GeneratedRoute, LngLat, RoutePlan } from "../../types/route.types";
import SearchBox from "./SearchBox";
import PointList from "./PointList";
import ModeToggle from "./ModeToggle";
import TargetDistance from "./TargetDistance";
import GenerateButton from "./GenerateButton";

interface PlannerPanelProps {
  plan: RoutePlan;
  dispatch: RoutePlanDispatch;
  map: mapboxgl.Map | null;
  onGenerated: (route: GeneratedRoute) => void;
}

const PlannerPanel = ({ plan, dispatch, map, onGenerated }: PlannerPanelProps) => {
  const handleAdd = (point: LngLat) => dispatch({ type: "addPoint", point });

  return (
    <div className="flex flex-col gap-3 w-full md:p-4 md:bg-white md:rounded-md md:shadow-md md:w-80">
      <SearchBox map={map} onAdd={handleAdd} />
      <PointList plan={plan} dispatch={dispatch} />
      <ModeToggle plan={plan} dispatch={dispatch} />
      <TargetDistance plan={plan} dispatch={dispatch} />
      <GenerateButton plan={plan} onGenerated={onGenerated} />
      <button
        onClick={() => dispatch({ type: "clear" })}
        className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
      >
        Clear
      </button>
    </div>
  );
};

export default PlannerPanel;
