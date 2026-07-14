"use client";
import type { RoutePlanDispatch } from "../../hooks/useRoutePlan";
import type { RoutePlan } from "../../types/route.types";

interface ModeToggleProps {
  plan: RoutePlan;
  dispatch: RoutePlanDispatch;
}

const ModeToggle = ({ plan, dispatch }: ModeToggleProps) => {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="mode-select" className="font-semibold text-sm">
        Mode
      </label>
      <select
        id="mode-select"
        value={plan.mode}
        onChange={(e) =>
          dispatch({ type: "setMode", mode: e.target.value as "loop" | "p2p" })
        }
        className="border rounded px-2 py-1 text-sm"
      >
        <option value="loop">Loop</option>
        <option value="p2p">Point-to-point</option>
      </select>
      {plan.mode === "p2p" && (
        <button
          onClick={() => dispatch({ type: "setEndNext" })}
          disabled={plan.endNext}
          className="ml-auto bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-bold py-1 px-3 rounded"
        >
          {plan.endNext ? "Click/search to set end…" : "Set end"}
        </button>
      )}
    </div>
  );
};

export default ModeToggle;
