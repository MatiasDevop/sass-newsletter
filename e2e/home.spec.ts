import { test, expect } from "@playwright/test"

// Basic smoke test for the homepage hero section
// Note: If Clerk or environment variables are required for SSR, you may need to
// configure them or mock auth for CI. This test targets public content.

test("homepage shows hero headline", async ({ page }) => {
  await page.goto("/")
  await expect(
    page.getByRole("heading", { name: /generate professional newsletters/i })
  ).toBeVisible()
})
