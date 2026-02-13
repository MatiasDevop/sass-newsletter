import { type Page, expect } from "@playwright/test";

/**
 * Signs in via Clerk UI using env-provided credentials.
 * Returns false if credentials are not set, letting the caller skip.
 */
export async function signInViaClerk(page: Page): Promise<boolean> {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;

  if (!email || !password) {
    return false;
  }

  // If already authenticated (via storage state), short-circuit
  try {
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    const heading = page.getByRole("heading", { name: /dashboard/i });
    if (await heading.isVisible({ timeout: 2000 }).catch(() => false)) {
      return true;
    }
  } catch {}

  // Fresh state for login attempts
  await page
    .context()
    .clearCookies()
    .catch(() => {});
  await page.addInitScript(() => {
    try {
      window.localStorage?.clear();
      window.sessionStorage?.clear();
    } catch {}
  });

  await page.goto("/sign-in", { waitUntil: "domcontentloaded" });

  // Detect Clerk iframe if present and scope interactions inside it.
  const iframes = page.locator("iframe");
  const useFrame = (await iframes.count()) > 0;
  let scope = useFrame ? page.frameLocator("iframe").first() : page;

  // Fallback: if no iframe on /sign-in, try the homepage CTA which opens a Clerk modal
  if (!useFrame) {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const getStarted = page.getByRole("button", {
      name: /get started|sign in|log in/i,
    });
    if ((await getStarted.count()) > 0) {
      await getStarted.first().click();
      await page.waitForLoadState("domcontentloaded");
      const modalIframe = page.frameLocator("iframe").first();
      scope = modalIframe;
    }
  }

  // Some Clerk UIs require choosing "Continue with email" first.
  const emailFlowBtn = scope.getByRole("button", {
    name: /continue with email|use email|email/i,
  });
  if ((await emailFlowBtn.count()) > 0) {
    await emailFlowBtn.first().click();
  }

  // Locate inputs (labels or placeholders, Clerk UI may vary)
  let emailInput = scope.getByLabel(/email address|email|username/i);
  if ((await emailInput.count()) === 0) {
    emailInput = scope.getByPlaceholder(/email address|email|username|name@/i);
  }
  if ((await emailInput.count()) === 0) {
    emailInput = scope.locator(
      'input[type="email"], input[name="email"], input[name="identifier"], input[autocomplete="email"]',
    );
  }
  if ((await emailInput.count()) === 0) {
    // No UI email input available (provider-only or custom screen)
    return false;
  }
  await emailInput.first().fill(email);

  // Some flows require clicking Continue before showing password
  const continueBtn = scope.getByRole("button", { name: /continue|next/i });
  if ((await continueBtn.count()) > 0) {
    await continueBtn.first().click();
  }

  let passwordInput = scope.getByLabel(/password/i);
  if ((await passwordInput.count()) === 0) {
    passwordInput = scope.getByPlaceholder(/password/i);
  }
  if ((await passwordInput.count()) === 0) {
    passwordInput = scope.locator(
      'input[type="password"], input[name="password"], input[autocomplete="current-password"]',
    );
  }
  if ((await passwordInput.count()) === 0) {
    // No UI password input available (code/OTP flow etc.)
    return false;
  }
  await passwordInput.first().fill(password);

  // Submit
  const submitBtn = scope.getByRole("button", {
    name: /sign in|continue|log in|submit|verify/i,
  });
  if ((await submitBtn.count()) > 0) {
    await submitBtn.first().click();
  } else {
    // If no obvious button, press Enter in password field
    await passwordInput.first().press("Enter");
  }

  // Wait for navigation away from sign-in, tolerate different redirect targets
  await page.waitForLoadState("domcontentloaded");
  await expect(page).not.toHaveURL(/sign-in/);
  return true;
}

/**
 * Signs out of Clerk. Tries visiting `/sign-out` and clicking a likely button,
 * then clears cookies and storage as a fallback. Never throws fatally.
 */
export async function signOut(page: Page): Promise<void> {
  try {
    // Attempt Clerk sign-out route if present
    await page.goto("/sign-out", { waitUntil: "domcontentloaded" });
    const btn = page
      .getByRole("button", { name: /sign out|log out|continue/i })
      .first();
    await btn.click({ timeout: 3000 }).catch(() => {});
    await page.waitForLoadState("domcontentloaded");
  } catch {}

  // Always clear cookies and storage to ensure a signed-out state
  try {
    await page.context().clearCookies();
  } catch {}
  try {
    await page.evaluate(() => {
      try {
        window.localStorage?.clear();
        window.sessionStorage?.clear();
      } catch {}
    });
  } catch {}
}
