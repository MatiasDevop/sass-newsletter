import { defineConfig } from "@playwright/test"

export default defineConfig({
  testDir: "../",
  use: {
    baseURL: "http://localhost:3000",
    browserName: "chromium",
    headless: true,
  },
  webServer: {
    command: "pnpm run dev",
    url: "http://localhost:3000",
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
})
