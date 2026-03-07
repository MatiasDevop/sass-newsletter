import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/helpers", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("@/lib/rss/feed-refresh", () => ({
  getFeedsToRefresh: vi.fn(),
}));

vi.mock("@/actions/rss-article", () => ({
  getArticlesByFeedsAndDateRange: vi.fn(),
}));

import { getArticlesByFeedsAndDateRange } from "@/actions/rss-article";
import { getCurrentUser } from "@/lib/auth/helpers";
import { getFeedsToRefresh } from "@/lib/rss/feed-refresh";
import { POST } from "@/app/api/newsletter/prepare/route";

const mockedGetCurrentUser = vi.mocked(getCurrentUser);
const mockedGetFeedsToRefresh = vi.mocked(getFeedsToRefresh);
const mockedGetArticlesByFeedsAndDateRange = vi.mocked(
  getArticlesByFeedsAndDateRange,
);

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/newsletter/prepare", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/newsletter/prepare", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("returns 400 when feedIds is missing or empty", async () => {
    const response = await POST(
      makeRequest({ feedIds: [], startDate: "2026-03-01", endDate: "2026-03-07" }) as never,
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "feedIds is required and must be a non-empty array",
    });
    expect(mockedGetCurrentUser).not.toHaveBeenCalled();
  });

  it("returns 400 when date range is missing", async () => {
    const response = await POST(
      makeRequest({ feedIds: ["f1"] }) as never,
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "startDate and endDate are required",
    });
    expect(mockedGetCurrentUser).not.toHaveBeenCalled();
  });

  it("returns refresh and article metadata when request is valid", async () => {
    mockedGetCurrentUser.mockResolvedValue({ id: "user-1" } as never);
    mockedGetFeedsToRefresh.mockResolvedValue(["f1"]);
    mockedGetArticlesByFeedsAndDateRange.mockResolvedValue([
      { id: "a1" },
      { id: "a2" },
      { id: "a3" },
    ] as never);

    const response = await POST(
      makeRequest({
        feedIds: ["f1", "f2"],
        startDate: "2026-03-01T00:00:00.000Z",
        endDate: "2026-03-07T23:59:59.999Z",
      }) as never,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      feedsToRefresh: 1,
      articlesFound: 3,
    });
    expect(mockedGetArticlesByFeedsAndDateRange).toHaveBeenCalledWith(
      ["f1", "f2"],
      new Date("2026-03-01T00:00:00.000Z"),
      new Date("2026-03-07T23:59:59.999Z"),
      100,
    );
  });

  it("returns 500 when dependency throws", async () => {
    mockedGetCurrentUser.mockRejectedValue(new Error("unauthorized"));

    const response = await POST(
      makeRequest({
        feedIds: ["f1"],
        startDate: "2026-03-01T00:00:00.000Z",
        endDate: "2026-03-07T23:59:59.999Z",
      }) as never,
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Failed to prepare newsletter: unauthorized",
    });
  });
});
