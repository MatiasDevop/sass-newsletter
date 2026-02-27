import { describe, expect, it } from "vitest";
import {
  buildArticleSummaries,
  buildNewsletterPrompt,
} from "@/lib/newsletter/prompt-builder";

type ArticleInput = Parameters<typeof buildArticleSummaries>[0][number];
type PromptParams = Parameters<typeof buildNewsletterPrompt>[0];
type PromptSettings = NonNullable<PromptParams["settings"]>;

describe("newsletter prompt builder", () => {
  it("builds article summaries with fallback and numbering", () => {
    const articles = [
      {
        title: "First Post",
        feed: { title: "Tech Feed" },
        pubDate: new Date("2025-01-01T00:00:00Z"),
        summary: "Short summary",
        link: "https://example.com/1",
      },
      {
        title: "Second Post",
        feed: { title: "Tech Feed" },
        pubDate: new Date("2025-01-02T00:00:00Z"),
        content: "Long content that should be truncated to fallback summary.",
        link: "https://example.com/2",
      },
      {
        title: "Third Post",
        feed: { title: "Biz Feed" },
        pubDate: null,
        link: "https://example.com/3",
      },
    ] satisfies ArticleInput[];

    const out = buildArticleSummaries(articles);
    expect(out).toContain('1. "First Post"');
    expect(out).toContain('2. "Second Post"');
    expect(out).toContain('3. "Third Post"');
    expect(out).toContain("Summary: Short summary");
    expect(out).toContain("Summary: Long content");
    expect(out).toContain("Source: Tech Feed");
    expect(out).toContain("Source: Biz Feed");
    expect(out).toContain("Link: https://example.com/3");
  });

  it("includes settings, user instructions, and conditional requirements", () => {
    const settings = {
      newsletterName: "AI Weekly",
      description: "Updates in AI",
      targetAudience: "Engineers",
      defaultTone: "Professional",
      brandVoice: "Confident",
      companyNaeme: "Acme AI",
      industry: "Technology",
      senderName: "Jane Doe",
      senderEmail: "jane@example.com",
      defaultTags: ["AI", "ML"],
      disclaimerText: "Not investment advice.",
      customFooter: "Subscribe for more.",
      id: "",
      userId: "",
      createdAt: new Date(),
      updatedAt: new Date(),
    } satisfies PromptSettings;

    const params = {
      startDate: new Date("2025-01-01"),
      endDate: new Date("2025-01-31"),
      articleSummaries: '1. "A"\n',
      articleCount: 1,
      userInput: "Focus on AI ethics",
      settings,
    } satisfies PromptParams;

    const prompt = buildNewsletterPrompt(params);

    expect(prompt).toContain("DATE RANGE:");
    expect(prompt).toContain("ARTICLES (1 total):");
    expect(prompt).toContain("NEWSLETTER SETTINGS:");
    expect(prompt).toContain("Newsletter Name: AI Weekly");
    expect(prompt).toContain("Brand Voice: Confident");
    expect(prompt).toContain("Tags: AI, ML");
    expect(prompt).toContain("CRITICAL USER INSTRUCTIONS");
    expect(prompt).toContain("Focus on AI ethics");
    expect(prompt).toMatch(/include the required disclaimer text/i);
    expect(prompt).toMatch(/include the required footer content/i);
  });

  it("omits optional sections when settings and input are absent", () => {
    const params = {
      startDate: new Date("2025-02-01"),
      endDate: new Date("2025-02-28"),
      articleSummaries: "",
      articleCount: 0,
    } satisfies PromptParams;

    const prompt = buildNewsletterPrompt(params);
    expect(prompt).not.toContain("NEWSLETTER SETTINGS:");
    expect(prompt).not.toContain("CRITICAL USER INSTRUCTIONS");
  });
});
