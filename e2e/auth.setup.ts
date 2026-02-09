import { test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const STATE_PATH = path.join("e2e", ".auth", "state.json");

test.describe("auth setup (manual or env)", () => {
  test("record storage state after login", async ({ page }) => {
    // If storage state already exists, do nothing
    if (fs.existsSync(STATE_PATH)) {
      test.skip(true, "Storage state already recorded");
    }

    // Try navigating directly to dashboard; if not logged in, the app should redirect
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });

    // Wait up to 90s for dashboard heading to appear (allows manual login in headed/UI mode)
    try {
      await page.getByRole("heading", { name: /dashboard/i }).waitFor({ timeout: 90_000 });
    } catch {
      // If heading didn't appear, bail out for now
      test.skip(true, "Dashboard not reached; login may be required");
    }

    // Ensure directory exists and persist auth for future runs
    fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true });
    await page.context().storageState({ path: STATE_PATH });
  });
});
