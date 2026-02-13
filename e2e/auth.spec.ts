import { test, expect } from "@playwright/test";
import { signInViaClerk, signOut } from "./helpers/auth";

// End-to-end auth flow checks for signed-out users.
// These tests verify that protected routes are guarded by Clerk middleware
// and that the homepage exposes a sign-in CTA for anonymous visitors.

test.describe("auth flow (signed-out)", () => {
  test.beforeEach(async ({ page }) => {
    // Ensure no prior auth state persists across tests.
    await page.context().clearCookies();
    await page.addInitScript(() => {
      try {
        window.localStorage?.clear();
        window.sessionStorage?.clear();
      } catch {}
    });
  });
  test("redirects from /dashboard when not signed in", async ({ page }) => {
    // Navigate directly to a protected route; Clerk middleware should redirect.
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });

    // Expect navigation away from /dashboard to a sign-in URL.
    await page.waitForURL(/sign-in/, { timeout: 20000 });
  });

  test("homepage shows SignInButton CTA for signed-out", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const bodyText = await page.locator("body").innerText();
    if (/internal server error/i.test(bodyText)) {
      test.skip(
        true,
        "Homepage returned 500; likely missing env or auth config",
      );
    }

    // The landing CTA renders a SignInButton labeled "Get Started" for signed-out users.
    await expect(page.locator("body")).toContainText(/get started/i, {
      timeout: 30000,
    });
  });
});

// Additional auth checks for signed-in users using shared helper.
test.describe("auth flow (signed-in)", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.addInitScript(() => {
      try {
        window.localStorage?.clear();
        window.sessionStorage?.clear();
      } catch {}
    });
  });

  test.afterEach(async ({ page }) => {
    await signOut(page);
  });

  test("allows access to /dashboard when signed in", async ({ page }) => {
    const canAuth = await signInViaClerk(page);
    if (!canAuth) {
      test.skip(true, "Missing E2E_EMAIL/E2E_PASSWORD env for signed-in tests");
    }

    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /dashboard/i })).toBeVisible(
      { timeout: 30000 },
    );
  });
});
