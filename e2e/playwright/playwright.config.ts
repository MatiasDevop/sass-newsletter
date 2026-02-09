import "dotenv/config";
import { defineConfig } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

// Use a dedicated test port to avoid local conflicts.
const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:3001";
const STORAGE_PATH = path.join("e2e", ".auth", "state.json");
const HAS_STORAGE = fs.existsSync(STORAGE_PATH);

export default defineConfig({
  testDir: "../",
  use: {
    baseURL: BASE_URL,
    browserName: "chromium",
    headless: true,
    storageState: HAS_STORAGE ? STORAGE_PATH : undefined,
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
