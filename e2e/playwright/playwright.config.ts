import { defineConfig } from "@playwright/test";

// Use a dedicated test port to avoid local conflicts.
const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:3001";

export default defineConfig({
  testDir: "../",
  use: {
    baseURL: BASE_URL,
    browserName: "chromium",
    headless: true,
    // Capture artifacts useful for debugging and reports
    trace: "on-first-retry",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  // Generate an HTML report alongside the console output
  reporter: [["list"], ["html", { open: "never" }]],
  webServer: {
    // Start Next dev server via package script; set PORT via env
    command: "pnpm run dev",
    url: BASE_URL,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
    env: {
      PORT: "3001",
      HOSTNAME: "0.0.0.0",
    },
  },
});
