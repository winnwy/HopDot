import RunPlanner from "@/components/RunPlanner";

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">HopDot</h1>
      <RunPlanner />
      <footer className="mt-8 text-center text-sm text-gray-500">
        {/* Footer content */}
      </footer>
    </main>
  );
}
