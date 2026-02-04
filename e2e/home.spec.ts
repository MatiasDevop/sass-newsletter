import { test, expect } from "@playwright/test"

// Basic smoke test for the homepage hero section
// Note: If Clerk or environment variables are required for SSR, you may need to
// configure them or mock auth for CI. This test targets public content.

test("homepage shows hero headline", async ({ page, request }) => {
  // Wait for dev server to respond before opening the browser page.
  await expect
    .poll(async () => {
      try {
        const res = await request.get("/")
        return res.ok()
      } catch {
        return false
      }
    }, { timeout: 15000, intervals: [500, 1000, 2000] })
    .toBe(true)

  // Navigate and wait for the app shell to be ready. Dev server can recompile on first hit.
  await page.goto("/", { waitUntil: "domcontentloaded" })
  await expect(
    page.getByRole("heading", { name: /generate professional newsletters/i })
  ).toBeVisible()
})
