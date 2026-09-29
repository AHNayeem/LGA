import { defineConfig, devices } from "@playwright/test";
import { FAKE_MIC } from "./playwright.config.mjs";

// Used only by scripts/atlas-e2e.mjs, which starts (and restarts) the server itself
// against a real Atlas database and runs this config once per phase.
if (!process.env.ATLAS_E2E_PHASE || !process.env.ATLAS_E2E_BASE_URL) {
  throw new Error("Run the Atlas E2E suite with `bun run test:e2e:atlas`.");
}

export default defineConfig({
  testDir: "tests/e2e-atlas",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  timeout: 180_000,
  use: { baseURL: process.env.ATLAS_E2E_BASE_URL, trace: "retain-on-failure" },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"], ...FAKE_MIC, extraHTTPHeaders: { "x-forwarded-for": "10.0.1.1" } } },
    { name: "mobile", use: { ...devices["Pixel 7"], ...FAKE_MIC, extraHTTPHeaders: { "x-forwarded-for": "10.0.1.2" } } },
  ],
});
