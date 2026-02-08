import { defineConfig } from "@playwright/test";

// Attach-mode config: assumes dev server is already running.
// Default to dedicated test port 3001 unless E2E_BASE_URL is provided.
const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:3001";

export default defineConfig({
  testDir: "../",
  use: {
    baseURL: BASE_URL,
    browserName: "chromium",
    headless: false,
  },
});
