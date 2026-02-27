import type Parser from "rss-parser";
import { describe, expect, it } from "vitest";
import { extractArticles, extractFeedMetadata } from "@/lib/rss/parser";

type TestFeed = Parser.Output<unknown>;

function makeFeed(overrides: Partial<TestFeed> = {}): TestFeed {
  return {
    title: "Example Feed",
    description: "Desc",
    link: "https://example.com",
    image: { url: "https://example.com/logo.png" },
    items: [],
    ...overrides,
  } as TestFeed;
}

describe("rss parser utilities", () => {
  it("extracts feed metadata with defaults", () => {
    const feed = makeFeed();
    const meta = extractFeedMetadata(feed);
    expect(meta.title).toBe("Example Feed");
    expect(meta.description).toBe("Desc");
    expect(meta.link).toBe("https://example.com");
    expect(meta.imageUrl).toBe("https://example.com/logo.png");
  });

  it("normalizes categories from strings and xml2js objects", () => {
    const feed = makeFeed({
      items: [
        {
          title: "Item 1",
          link: "https://example.com/1",
          guid: "1",
          pubDate: "2025-01-01",
          categories: [
            "AI",
            { _: "ML", $: { domain: "topics" } },
            123 as unknown as string, // unexpected formats are skipped
          ],
          enclosure: { url: "https://example.com/img.jpg", type: "image/jpeg" },
        } as unknown as Parser.Item,
      ],
    });

    const articles = extractArticles(feed, "feed-1");
    expect(articles).toHaveLength(1);
    const a = articles[0];
    expect(a.title).toBe("Item 1");
    expect(a.categories).toEqual(["AI", "ML"]);
    expect(a.imageUrl).toBe("https://example.com/img.jpg");
    expect(typeof a.pubDate.getTime()).toBe("number");
  });
});
