"use client";

import RunPlanner from "@/components/RunPlanner";
import Toolbar from "@/components/Toolbar";

export default function Home() {
  const date = new Date();

  return (
    <main className="container mx-auto px-4 py-8 flex flex-col h-screen">
      <div className="fixed top-4 right-8 z-50 flex flex-col items-end">
        <h1 className="text-3xl font-bold bg-white/70 px-4 py-2 rounded shadow-lg mb-2 pointer-events-none select-none">
          HopDot
        </h1>
        <div className="w-full">
          <Toolbar />
        </div>
      </div>
      <div className="flex-1 mt-32">
        <RunPlanner />
      </div>
      <footer className="mt-8 text-center text-sm text-gray-500">
        GOGOGOOSE @ {date.getFullYear()}
      </footer>
    </main>
  );
}
