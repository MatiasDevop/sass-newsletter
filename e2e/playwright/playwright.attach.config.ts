import { defineConfig } from "@playwright/test"

// Attach-mode config: assumes dev server is already running at localhost:3000.
export default defineConfig({
  testDir: "../",
  use: {
    baseURL: "http://localhost:3000",
    browserName: "chromium",
    headless: false,
  },
})
