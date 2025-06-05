"use client";

import RunPlanner from "@/components/RunPlanner";

export default function Home() {
  const date = new Date();

  return (
    <main className="container mx-auto px-4 py-8 flex flex-col h-screen">
      <h1 className="fixed top-4 right-8 z-50 text-3xl font-bold bg-white/70 px-4 py-2 rounded shadow-lg mb-6 pointer-events-none select-none">
        HopDot
      </h1>
      <div className="flex-1">
        <RunPlanner />
      </div>
      <footer className="mt-8 text-center text-sm text-gray-500">
        GOGOGOOSE @ {date.getFullYear()}
      </footer>
    </main>
  );
}
