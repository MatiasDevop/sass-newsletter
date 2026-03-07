import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    rssArticle: {
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import { bulkCreateRssArticles, createRssArticle } from "@/actions/rss-article";

const mockedFindUnique = vi.mocked(prisma.rssArticle.findUnique);
const mockedUpdate = vi.mocked(prisma.rssArticle.update);
const mockedCreate = vi.mocked(prisma.rssArticle.create);

function makeArticleData(overrides: Partial<Parameters<typeof createRssArticle>[0]> = {}) {
  return {
    feedId: "feed-1",
    guid: "guid-1",
    title: "Title",
    link: "https://example.com/article",
    pubDate: new Date("2026-03-07T00:00:00.000Z"),
    ...overrides,
  };
}

describe("rss article actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("updates sourceFeedIds when article exists but current feed is missing", async () => {
    mockedFindUnique.mockResolvedValueOnce({
      id: "article-1",
      sourceFeedIds: ["feed-2"],
    });
    mockedUpdate.mockResolvedValue({
      id: "article-1",
      guid: "guid-1",
      sourceFeedIds: ["feed-2", "feed-1"],
    } as never);

    const result = await createRssArticle(makeArticleData());

    expect(mockedUpdate).toHaveBeenCalledWith({
      where: { guid: "guid-1" },
      data: {
        sourceFeedIds: {
          push: "feed-1",
        },
      },
    });
    expect(result).toEqual(
      expect.objectContaining({
        id: "article-1",
        sourceFeedIds: ["feed-2", "feed-1"],
      }),
    );
  });

  it("returns existing article when feed is already in sourceFeedIds", async () => {
    mockedFindUnique
      .mockResolvedValueOnce({
        id: "article-1",
        sourceFeedIds: ["feed-1"],
      })
      .mockResolvedValueOnce({
        id: "article-1",
        guid: "guid-1",
        sourceFeedIds: ["feed-1"],
      } as never);

    const result = await createRssArticle(makeArticleData());

    expect(mockedUpdate).not.toHaveBeenCalled();
    expect(mockedFindUnique).toHaveBeenNthCalledWith(2, {
      where: { guid: "guid-1" },
    });
    expect(result).toEqual(
      expect.objectContaining({
        id: "article-1",
        guid: "guid-1",
      }),
    );
  });

  it("creates a new article with sourceFeedIds seeded from feedId", async () => {
    mockedFindUnique.mockResolvedValueOnce(null);
    mockedCreate.mockResolvedValue({
      id: "article-new",
      guid: "guid-1",
      sourceFeedIds: ["feed-1"],
      categories: [],
    } as never);

    const data = makeArticleData({ categories: undefined });
    const result = await createRssArticle(data);

    expect(mockedCreate).toHaveBeenCalledWith({
      data: {
        feedId: "feed-1",
        guid: "guid-1",
        sourceFeedIds: ["feed-1"],
        title: "Title",
        link: "https://example.com/article",
        content: undefined,
        summary: undefined,
        pubDate: new Date("2026-03-07T00:00:00.000Z"),
        author: undefined,
        categories: [],
        imageUrl: undefined,
      },
    });
    expect(result).toEqual(
      expect.objectContaining({
        id: "article-new",
        sourceFeedIds: ["feed-1"],
      }),
    );
  });

  it("counts created and errored items in bulk create", async () => {
    mockedFindUnique.mockResolvedValue(null);
    mockedCreate
      .mockResolvedValueOnce({ id: "a1" } as never)
      .mockRejectedValueOnce(new Error("db timeout"))
      .mockResolvedValueOnce({ id: "a3" } as never);

    const results = await bulkCreateRssArticles([
      makeArticleData({ guid: "g-1" }),
      makeArticleData({ guid: "g-2" }),
      makeArticleData({ guid: "g-3" }),
    ]);

    expect(results).toEqual({
      created: 2,
      skipped: 0,
      errors: 1,
    });
  });
});
