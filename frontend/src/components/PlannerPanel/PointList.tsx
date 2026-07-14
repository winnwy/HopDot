"use client";
import type { RoutePlanDispatch } from "../../hooks/useRoutePlan";
import type { RoutePlan } from "../../types/route.types";

interface PointListProps {
  plan: RoutePlan;
  dispatch: RoutePlanDispatch;
}

const formatCoord = ([lng, lat]: [number, number]) =>
  `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

const PointList = ({ plan, dispatch }: PointListProps) => {
  const hasEnd = plan.mode === "p2p" && !!plan.end;

  return (
    <ul className="flex flex-col gap-1 text-sm">
      {plan.start && (
        <li className="flex items-center gap-2 bg-gray-50 rounded px-2 py-1">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500" />
          <span className="flex-1">Start · {formatCoord(plan.start)}</span>
          <button
            onClick={() => dispatch({ type: "removePoint", index: 0 })}
            className="text-red-500 hover:text-red-700"
            aria-label="Remove start"
          >
            ✕
          </button>
        </li>
      )}

      {plan.waypoints.map((wp, i) => (
        <li key={i} className="flex items-center gap-2 bg-gray-50 rounded px-2 py-1">
          <span className="inline-flex items-center justify-center w-4 h-4 text-[10px] rounded-full bg-blue-500 text-white">
            {i + 1}
          </span>
          <span className="flex-1">{formatCoord(wp)}</span>
          <button
            onClick={() =>
              dispatch({ type: "reorderWaypoint", from: i, to: i - 1 })
            }
            disabled={i === 0}
            className="disabled:opacity-30 hover:text-gray-900"
            aria-label="Move up"
          >
            ↑
          </button>
          <button
            onClick={() =>
              dispatch({ type: "reorderWaypoint", from: i, to: i + 1 })
            }
            disabled={i === plan.waypoints.length - 1}
            className="disabled:opacity-30 hover:text-gray-900"
            aria-label="Move down"
          >
            ↓
          </button>
          <button
            onClick={() => dispatch({ type: "removePoint", index: i + 1 })}
            className="text-red-500 hover:text-red-700"
            aria-label="Remove waypoint"
          >
            ✕
          </button>
        </li>
      ))}

      {hasEnd && plan.end && (
        <li className="flex items-center gap-2 bg-gray-50 rounded px-2 py-1">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500" />
          <span className="flex-1">End · {formatCoord(plan.end)}</span>
          <button
            onClick={() =>
              dispatch({
                type: "removePoint",
                index: plan.waypoints.length + 1,
              })
            }
            className="text-red-500 hover:text-red-700"
            aria-label="Remove end"
          >
            ✕
          </button>
        </li>
      )}

      {!plan.start && (
        <li className="text-gray-400 italic">Click the map or search to set a start point.</li>
      )}
    </ul>
  );
};

export default PointList;
