"use client";

import dynamic from "next/dynamic";

// mapbox-gl / search-js-react touch `document` at module scope, so RunPlanner
// (and everything it pulls in) must be client-only, no SSR/prerender —
// same reasoning as the M0 MapDisplay dynamic import it replaces.
const RunPlanner = dynamic(() => import("@/components/RunPlanner"), {
  ssr: false,
  loading: () => (
    <div className="h-full bg-gray-100 flex items-center justify-center">
      <div className="text-gray-600">Loading map...</div>
    </div>
  ),
});

export default function Home() {
  const date = new Date();

  return (
    <main className="container mx-auto px-4 py-8 flex flex-col h-screen">
      <h1 className="text-3xl font-bold mb-6">HopDot</h1>
      <div className="flex-1">
        <RunPlanner />
      </div>
      <footer className="mt-8 text-center text-sm text-gray-500">
        GOGOGOOSE @ {date.getFullYear()}
      </footer>
    </main>
  );
}