"use client";
import dynamic from "next/dynamic";

// Dynamically import MapDisplay with no SSR at all
const MapDisplay = dynamic(() => import("./MapDisplay"), {
  ssr: false,
  loading: () => (
    <div className="h-full bg-gray-100 flex items-center justify-center">
      <div className="text-gray-600">Loading map...</div>
    </div>
  ),
});

const RunPlanner = () => {
  return (
    <div className="h-full">
      <MapDisplay />
    </div>
  );
};

export default RunPlanner;