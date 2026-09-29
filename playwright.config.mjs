import { defineConfig, devices } from "@playwright/test";

const port = process.env.E2E_PORT ?? "3100";

// Requires a production build first: `bun run build && bun run test:e2e`.
//
// Chromium gets a fake microphone (a generated tone) so speaking recordings can be tested;
// individual tests revoke or break it to test the error states.
export const FAKE_MIC = {
  launchOptions: { args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] },
  permissions: ["microphone"],
};
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "retain-on-failure",
  },
  // Distinct client IPs per project so the per-IP auth rate limits don't interfere.
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"], ...FAKE_MIC, extraHTTPHeaders: { "x-forwarded-for": "10.0.0.1" } } },
    { name: "mobile", use: { ...devices["Pixel 7"], ...FAKE_MIC, extraHTTPHeaders: { "x-forwarded-for": "10.0.0.2" } } },
  ],
  webServer: {
    command: "node --import ./scripts/register.mjs scripts/e2e-server.mjs",
    url: `http://localhost:${port}/api/health`,
    timeout: 120_000,
    reuseExistingServer: false,
    env: { E2E_PORT: port },
  },
});
