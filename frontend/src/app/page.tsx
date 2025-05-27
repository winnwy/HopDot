"use client";

import RunPlanner from "@/components/RunPlanner";
import { useEffect, useState } from "react";


export default function Home() {
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setDate(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="container mx-auto px-4 py-8 flex flex-col h-screen">
      <h1 className="text-3xl font-bold mb-6">HopDot</h1>
      <div className="flex-1">
        <RunPlanner />
      </div>
      <footer className="mt-8 text-center text-sm text-gray-500">
        GOGOGOOSE @ {date.getFullYear()}
        {/* {date.toLocaleString()} */}
      </footer>
    </main>
  );
}
