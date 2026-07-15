import { defineConfig, devices } from "@playwright/test";

// Headless Chromium in CI/sandboxes often lacks a real GPU. Mapbox GL
// requires WebGL2; SwiftShader gives us a software WebGL2 implementation so
// the map can actually initialize (ubuntu-latest GitHub Actions runners
// support this too — see IMPLEMENTATION_PLAN.md §3 M4).
const SWIFTSHADER_ARGS = [
  "--use-gl=swiftshader",
  "--enable-unsafe-swiftshader",
  "--ignore-gpu-blocklist",
];

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "line" : "list",
  use: {
    baseURL: "http://localhost:3100",
    trace: "on-first-retry",
    launchOptions: {
      args: SWIFTSHADER_ARGS,
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run build && npm run start -- -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN:
        process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "pk.test-placeholder-token",
      NEXT_PUBLIC_API_URL: "http://localhost:8000",
    },
  },
});
