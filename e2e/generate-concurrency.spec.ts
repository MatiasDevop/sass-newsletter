import { expect, test } from "@playwright/test";
import { signInViaClerk } from "./helpers/auth";
import { createVirtualUsers } from "./helpers/virtual-users";

const NUM_USERS = Number(process.env.E2E_CONCURRENCY_USERS || "8");

interface PrepareResult {
    status: number;
    durationMs: number;
    body: {
        feedsToRefresh: number;
        articlesFound: number;
    } | null;
}

const DEFAULT_FEED_URL =
    process.env.E2E_PROVISION_FEED_URL || "https://hnrss.org/frontpage";

async function getDashboardFeedIds(page: Parameters<typeof test>[0]["page"]) {
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });

    return page.getByRole("checkbox").evaluateAll((elements) =>
        elements
            .map((el) => el.getAttribute("id"))
            .filter((id): id is string => Boolean(id)),
    );
}

async function provisionFeedIfNeeded(
    page: Parameters<typeof test>[0]["page"],
): Promise<string[]> {
    const existingFeedIds = await getDashboardFeedIds(page);
    if (existingFeedIds.length > 0) {
        return existingFeedIds;
    }

    const firstFeedTrigger = page
        .getByRole("button", { name: /add your first feed/i })
        .first();
    const genericAddTrigger = page.getByRole("button", { name: /^add feed$/i });

    if ((await firstFeedTrigger.count()) > 0) {
        await firstFeedTrigger.click();
    } else if ((await genericAddTrigger.count()) > 0) {
        await genericAddTrigger.first().click();
    } else {
        return [];
    }

    const feedUrlInput = page.getByLabel(/rss feed url/i).first();
    await expect(feedUrlInput).toBeVisible({ timeout: 15000 });
    await feedUrlInput.fill(DEFAULT_FEED_URL);

    const confirmAddButton = page
        .locator('[role="dialog"]')
        .getByRole("button", { name: /^add feed$/i })
        .first();
    await confirmAddButton.click();

    await expect(feedUrlInput).not.toBeVisible({ timeout: 60000 });

    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    const newFeedIds = await page.getByRole("checkbox").evaluateAll((elements) =>
        elements
            .map((el) => el.getAttribute("id"))
            .filter((id): id is string => Boolean(id)),
    );

    return newFeedIds;
}

async function runPrepareRequest(
    browser: Parameters<typeof test>[0]["browser"],
    storageState: Awaited<ReturnType<Parameters<typeof test>[0]["page"]["context"]["storageState"]>>,
    payload: { feedIds: string[]; startDate: string; endDate: string },
): Promise<PrepareResult> {
    const context = await browser.newContext({ storageState });

    try {
        const start = Date.now();
        const response = await context.request.post("/api/newsletter/prepare", {
            data: payload,
        });
        const durationMs = Date.now() - start;
        const body = await response.json().catch(() => null);

        return {
            status: response.status(),
            durationMs,
            body,
        };
    } finally {
        await context.close();
    }
}

test("simulate multiple fake users generating resources concurrently", async ({
    browser,
    page,
}) => {
    const canAuth = await signInViaClerk(page);
    if (!canAuth) {
        test.skip(
            true,
            "Missing storage state and E2E_EMAIL/E2E_PASSWORD env for signed-in tests",
        );
    }

    const feedIds = await getDashboardFeedIds(page);

    if (feedIds.length === 0) {
        test.skip(true, "No RSS feeds found for current test user");
    }

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const payload = {
        feedIds,
        startDate: oneWeekAgo.toISOString(),
        endDate: now.toISOString(),
    };

    const storageState = await page.context().storageState();
    const users = createVirtualUsers(NUM_USERS);

    const wave1 = await Promise.all(
        users.map(() => runPrepareRequest(browser, storageState, payload)),
    );

    wave1.forEach((result) => {
        expect(result.status).toBe(200);
        expect(result.body).not.toBeNull();
        expect(result.body?.feedsToRefresh).toBeGreaterThanOrEqual(0);
        expect(result.body?.articlesFound).toBeGreaterThanOrEqual(0);
    });

    const wave2 = await Promise.all(
        users.map(() => runPrepareRequest(browser, storageState, payload)),
    );

    wave2.forEach((result) => {
        expect(result.status).toBe(200);
        expect(result.body).not.toBeNull();
        expect(result.body?.feedsToRefresh).toBeGreaterThanOrEqual(0);
        expect(result.body?.articlesFound).toBeGreaterThanOrEqual(0);
    });

    const maxFeedsToRefreshWave1 = Math.max(
        ...wave1.map((result) => result.body?.feedsToRefresh ?? 0),
    );
    const maxFeedsToRefreshWave2 = Math.max(
        ...wave2.map((result) => result.body?.feedsToRefresh ?? 0),
    );

    expect(maxFeedsToRefreshWave2).toBeLessThanOrEqual(maxFeedsToRefreshWave1);

    const averageWave1 =
        wave1.reduce((acc, result) => acc + result.durationMs, 0) / wave1.length;
    const averageWave2 =
        wave2.reduce((acc, result) => acc + result.durationMs, 0) / wave2.length;

    expect.soft(averageWave2).toBeLessThanOrEqual(averageWave1 * 1.75);
});

test("auto-provision feed then run concurrent prepare requests", async ({
    browser,
    page,
}) => {
    const canAuth = await signInViaClerk(page);
    if (!canAuth) {
        test.skip(
            true,
            "Missing storage state and E2E_EMAIL/E2E_PASSWORD env for signed-in tests",
        );
    }

    const feedIds = await provisionFeedIfNeeded(page);
    expect(feedIds.length).toBeGreaterThan(0);

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const payload = {
        feedIds,
        startDate: oneWeekAgo.toISOString(),
        endDate: now.toISOString(),
    };

    const storageState = await page.context().storageState();
    const users = createVirtualUsers(NUM_USERS);

    const firstWave = await Promise.all(
        users.map(() => runPrepareRequest(browser, storageState, payload)),
    );

    firstWave.forEach((result) => {
        expect(result.status).toBe(200);
        expect(result.body).not.toBeNull();
        expect(result.body?.articlesFound).toBeGreaterThanOrEqual(0);
    });

    const secondWave = await Promise.all(
        users.map(() => runPrepareRequest(browser, storageState, payload)),
    );

    secondWave.forEach((result) => {
        expect(result.status).toBe(200);
        expect(result.body).not.toBeNull();
        expect(result.body?.articlesFound).toBeGreaterThanOrEqual(0);
    });

    const maxWave1Refresh = Math.max(
        ...firstWave.map((result) => result.body?.feedsToRefresh ?? 0),
    );
    const maxWave2Refresh = Math.max(
        ...secondWave.map((result) => result.body?.feedsToRefresh ?? 0),
    );

    expect(maxWave2Refresh).toBeLessThanOrEqual(maxWave1Refresh);
});

/**
 * Visual test: Opens multiple browser windows simultaneously.
 * Run with: pnpm exec playwright test -g "visual" --headed
 */
test("visual: multiple browser windows hitting dashboard concurrently", async ({
    browser,
    page,
}) => {
    const canAuth = await signInViaClerk(page);
    if (!canAuth) {
        test.skip(
            true,
            "Missing storage state and E2E_EMAIL/E2E_PASSWORD env for signed-in tests",
        );
    }

    const storageState = await page.context().storageState();
    const numWindows = Math.min(NUM_USERS, 4); // Cap at 4 for visibility

    // Create multiple browser contexts with visible pages
    const contexts = await Promise.all(
        Array.from({ length: numWindows }, () =>
            browser.newContext({ storageState }),
        ),
    );

    const pages = await Promise.all(contexts.map((ctx) => ctx.newPage()));

    // Navigate all pages to dashboard simultaneously
    const navigationStart = Date.now();
    await Promise.all(
        pages.map((p, i) =>
            p.goto(`/dashboard?user=${i + 1}`, { waitUntil: "domcontentloaded" }),
        ),
    );
    const navigationDuration = Date.now() - navigationStart;

    // Verify all pages loaded successfully
    await Promise.all(
        pages.map(async (p) => {
            await expect(
                p.getByRole("heading", { name: /dashboard/i }),
            ).toBeVisible({ timeout: 30000 });
        }),
    );

    console.log(
        `✓ ${numWindows} browser windows loaded dashboard in ${navigationDuration}ms`,
    );

    // Cleanup
    await Promise.all(contexts.map((ctx) => ctx.close()));
});