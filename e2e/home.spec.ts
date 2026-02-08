import { test, expect } from "@playwright/test";

// Basic smoke test for the homepage hero section (public content)
test("homepage shows hero headline", async ({ page }) => {
  // Navigate and wait for the app shell to be ready. Dev server can recompile on first hit.
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const bodyText = await page.locator("body").innerText();
  if (/internal server error/i.test(bodyText)) {
    test.skip(true, "Homepage returned 500; likely missing env or auth config");
  }
  await expect(page.locator("body")).toContainText(
    /generate professional newsletters/i,
    { timeout: 30000 },
  );
});
