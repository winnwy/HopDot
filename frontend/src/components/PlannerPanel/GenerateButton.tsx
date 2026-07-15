"use client";
import { useState } from "react";
import { generateRoute } from "../../lib/api";
import type { GeneratedRoute, RoutePlan } from "../../types/route.types";

interface GenerateButtonProps {
  plan: RoutePlan;
  onGenerated: (route: GeneratedRoute) => void;
}

const GenerateButton = ({ plan, onGenerated }: GenerateButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canGenerate =
    plan.start !== null &&
    plan.targetKm > 0 &&
    (plan.mode !== "p2p" || plan.end !== null);

  const handleGenerate = async () => {
    if (!canGenerate || isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      const route = await generateRoute(plan);
      onGenerated(route);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Route generation failed.");
      onGenerated(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={handleGenerate}
        disabled={!canGenerate || isLoading}
        className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-bold py-2 px-4 rounded"
      >
        {isLoading ? "Generating…" : "Generate"}
      </button>
      {isLoading && (
        <p className="text-xs text-gray-500">
          This can take a minute on first use while the route service wakes up.
        </p>
      )}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1">
          {error}
        </div>
      )}
    </div>
  );
};

export default GenerateButton;
