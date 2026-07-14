"use client";
import { planToPoints } from "../../hooks/useRoutePlan";
import { haversineRouteKm } from "../../lib/geo";
import type { GeneratedRoute, RoutePlan } from "../../types/route.types";

interface GenerateButtonProps {
  plan: RoutePlan;
  onGenerated: (route: GeneratedRoute) => void;
}

/**
 * M1 STUB: draws a straight line through the plan's points and sums
 * haversine distance. Real ORS-backed generation (§1.3 of
 * IMPLEMENTATION_PLAN.md) lands in M3 via lib/api.ts — this button will be
 * rewired to call generateRoute() then.
 */
const GenerateButton = ({ plan, onGenerated }: GenerateButtonProps) => {
  const points = planToPoints(plan);
  const canGenerate = points.length >= 2;

  const handleGenerate = () => {
    if (!canGenerate) {
      onGenerated(null);
      return;
    }
    onGenerated({
      geometry: { type: "LineString", coordinates: points },
      distanceKm: haversineRouteKm(points),
      withinTolerance: false,
      warnings: ["stub: straight-line distance, not road-network snapped (M3 will replace this)"],
    });
  };

  return (
    <button
      onClick={handleGenerate}
      disabled={!canGenerate}
      className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-bold py-2 px-4 rounded"
    >
      Generate
    </button>
  );
};

export default GenerateButton;
