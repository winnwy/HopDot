"use client";
import type { RoutePlanDispatch } from "../../hooks/useRoutePlan";
import type { RoutePlan } from "../../types/route.types";

interface TargetDistanceProps {
  plan: RoutePlan;
  dispatch: RoutePlanDispatch;
}

const TargetDistance = ({ plan, dispatch }: TargetDistanceProps) => {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="target-km" className="font-semibold text-sm">
        Target
      </label>
      <input
        id="target-km"
        type="number"
        min={0.1}
        step={0.1}
        value={plan.targetKm}
        onChange={(e) =>
          dispatch({ type: "setTargetKm", km: Number(e.target.value) })
        }
        className="border rounded px-2 py-1 w-20 text-sm"
      />
      <span className="text-sm text-gray-600">km</span>
    </div>
  );
};

export default TargetDistance;
