import { expect, test } from "@playwright/test";

// Contract JSON per SPEC/IMPLEMENTATION_PLAN §4.1 RouteResponse: a LineString
// through 2 Sydney points, with a fixed distance so the assertion is exact.
const MOCK_ROUTE_RESPONSE = {
  geometry: {
    type: "LineString",
    coordinates: [
      [151.2093, -33.8688],
      [151.2153, -33.8712],
    ],
  },
  distance_km: 5.02,
  target_km: 5,
  within_tolerance: true,
  iterations: 0,
  warnings: [] as string[],
};

test.beforeEach(async ({ page }) => {
  // Headless Chromium in some sandboxes lacks a usable WebGL2 context even
  // with SwiftShader software rendering (playwright.config.ts already adds
  // --use-gl=swiftshader / --enable-unsafe-swiftshader for the ones that do
  // support it, and ubuntu-latest GitHub Actions runners are confirmed to).
  // Guard so the suite skips cleanly rather than failing hard where it can't
  // possibly run, instead of asserting on a map that never initializes.
  await page.goto("about:blank");
  const webglSupported = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    return !!canvas.getContext("webgl2");
  });
  test.skip(!webglSupported, "WebGL2 unavailable in this environment — Mapbox GL cannot initialize.");
});

test("generates a route via 2 map clicks and shows the distance in ResultBar", async ({
  page,
}) => {
  // Mock the backend contract endpoint — no live ORS/backend calls in this test.
  await page.route("**/api/route", async (route) => {
    await route.fulfill({ json: MOCK_ROUTE_RESPONSE });
  });

  await page.goto("/");

  const mapCanvas = page.getByTestId("map-canvas");
  // The map component is dynamically imported client-side (ssr: false), so
  // give it more than the default 5s on a first, uncached load.
  await expect(mapCanvas).toBeVisible({ timeout: 20_000 });

  // Map clicks add points directly through the mapboxgl click handler
  // (MapCanvas.tsx) — this works from the raw canvas/camera transform and
  // does not depend on style/tile network requests succeeding, so it's
  // robust even with a placeholder Mapbox token in this environment.
  const box = await mapCanvas.boundingBox();
  if (!box) throw new Error("map canvas has no bounding box");

  // First click sets the start point; second adds a waypoint. Click handlers
  // attach once the underlying mapboxgl.Map instance is constructed and its
  // reference is picked up by a React re-render, which can lag the map div
  // becoming visible by a tick — retry the first click until it registers.
  await expect(async () => {
    await mapCanvas.click({ position: { x: box.width * 0.4, y: box.height * 0.4 } });
    await expect(page.getByText(/Start ·/)).toBeVisible({ timeout: 1_000 });
  }).toPass({ timeout: 15_000 });

  await mapCanvas.click({ position: { x: box.width * 0.6, y: box.height * 0.6 } });
  await expect(page.getByText(/Start ·/)).toBeVisible();

  const generateButton = page.getByRole("button", { name: /^Generate$/ });
  await expect(generateButton).toBeEnabled();
  await generateButton.click();

  // ResultBar renders once for the mobile bottom-sheet layout and once for
  // the desktop layout (only one is visible at a time via CSS, per
  // RunPlanner.tsx) — scope to the visible instance.
  await expect(page.getByTestId("result-distance").locator("visible=true")).toContainText(
    "5.02 km",
  );
});
