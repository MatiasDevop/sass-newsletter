import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    rssFeed: {
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
  },
}));

vi.mock("@/actions/rss-fetch", () => ({
  fetchAndStoreFeed: vi.fn(),
}));

vi.mock("@/actions/rss-article", () => ({
  getArticlesByFeedsAndDateRange: vi.fn(),
}));

import { getArticlesByFeedsAndDateRange } from "@/actions/rss-article";
import { fetchAndStoreFeed } from "@/actions/rss-fetch";
import { prisma } from "@/lib/prisma";
import {
  ARTICLE_LIMIT,
  getFeedsToRefresh,
  prepareFeedsAndArticles,
} from "@/lib/rss/feed-refresh";

const mockedFindMany = vi.mocked(prisma.rssFeed.findMany);
const mockedGroupBy = vi.mocked(prisma.rssFeed.groupBy);
const mockedFetchAndStoreFeed = vi.mocked(fetchAndStoreFeed);
const mockedGetArticlesByFeedsAndDateRange = vi.mocked(
  getArticlesByFeedsAndDateRange,
);

describe("feed refresh utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  it("returns only feed ids whose URLs are not recently fetched", async () => {
    mockedFindMany.mockResolvedValue([
      { id: "f1", url: "https://example.com/a.xml" },
      { id: "f2", url: "https://example.com/b.xml" },
      { id: "f3", url: "https://example.com/a.xml" },
    ]);
    mockedGroupBy.mockResolvedValue([
      {
        url: "https://example.com/a.xml",
        _max: { lastFetched: new Date() },
      },
    ]);

    const result = await getFeedsToRefresh(["f1", "f2", "f3"]);

    expect(result).toEqual(["f2"]);
    expect(mockedGroupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        by: ["url"],
        where: expect.objectContaining({
          url: {
            in: expect.arrayContaining([
              "https://example.com/a.xml",
              "https://example.com/b.xml",
            ]),
          },
        }),
      }),
    );
  });

  it("returns an empty list when all feed URLs are fresh", async () => {
    mockedFindMany.mockResolvedValue([
      { id: "f1", url: "https://example.com/a.xml" },
      { id: "f2", url: "https://example.com/b.xml" },
    ]);
    mockedGroupBy.mockResolvedValue([
      {
        url: "https://example.com/a.xml",
        _max: { lastFetched: new Date() },
      },
      {
        url: "https://example.com/b.xml",
        _max: { lastFetched: new Date() },
      },
    ]);

    await expect(getFeedsToRefresh(["f1", "f2"])).resolves.toEqual([]);
  });

  it("refreshes stale feeds and still returns articles when one refresh fails", async () => {
    mockedFindMany.mockResolvedValue([
      { id: "f1", url: "https://example.com/a.xml" },
      { id: "f2", url: "https://example.com/b.xml" },
    ]);
    mockedGroupBy.mockResolvedValue([]);
    mockedFetchAndStoreFeed
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("network"));

    const articles = [
      {
        id: "a1",
        sourceFeedIds: ["f1"],
      },
    ];
    mockedGetArticlesByFeedsAndDateRange.mockResolvedValue(
      articles as Awaited<ReturnType<typeof getArticlesByFeedsAndDateRange>>,
    );

    const startDate = new Date("2026-03-01T00:00:00.000Z");
    const endDate = new Date("2026-03-07T23:59:59.999Z");

    const result = await prepareFeedsAndArticles({
      feedIds: ["f1", "f2"],
      startDate,
      endDate,
    });

    expect(mockedFetchAndStoreFeed).toHaveBeenCalledTimes(2);
    expect(mockedGetArticlesByFeedsAndDateRange).toHaveBeenCalledWith(
      ["f1", "f2"],
      startDate,
      endDate,
      ARTICLE_LIMIT,
    );
    expect(result).toBe(articles);
  });

  it("skips refresh when all feeds are fresh and returns articles", async () => {
    mockedFindMany.mockResolvedValue([
      { id: "f1", url: "https://example.com/a.xml" },
    ]);
    mockedGroupBy.mockResolvedValue([
      {
        url: "https://example.com/a.xml",
        _max: { lastFetched: new Date() },
      },
    ]);

    const articles = [{ id: "a1", sourceFeedIds: ["f1"] }];
    mockedGetArticlesByFeedsAndDateRange.mockResolvedValue(
      articles as Awaited<ReturnType<typeof getArticlesByFeedsAndDateRange>>,
    );

    const result = await prepareFeedsAndArticles({
      feedIds: ["f1"],
      startDate: new Date("2026-03-01"),
      endDate: new Date("2026-03-07"),
    });

    expect(mockedFetchAndStoreFeed).not.toHaveBeenCalled();
    expect(result).toBe(articles);
  });

  it("throws when no articles are found for the selected range", async () => {
    mockedFindMany.mockResolvedValue([
      { id: "f1", url: "https://example.com/a.xml" },
    ]);
    mockedGroupBy.mockResolvedValue([
      {
        url: "https://example.com/a.xml",
        _max: { lastFetched: new Date() },
      },
    ]);
    mockedGetArticlesByFeedsAndDateRange.mockResolvedValue([]);

    await expect(
      prepareFeedsAndArticles({
        feedIds: ["f1"],
        startDate: new Date("2026-03-01"),
        endDate: new Date("2026-03-07"),
      }),
    ).rejects.toThrow(
      "No articles found for the selected feeds and date range",
    );
  });
});
