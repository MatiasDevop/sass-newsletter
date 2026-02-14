import { describe, it, expect } from "vitest";
import {
  buildArticleSummaries,
  buildNewsletterPrompt,
} from "@/lib/newsletter/prompt-builder";

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
    ];

    const out = buildArticleSummaries(articles as any);
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
    const params = {
      startDate: new Date("2025-01-01"),
      endDate: new Date("2025-01-31"),
      articleSummaries: "1. \"A\"\n",
      articleCount: 1,
      userInput: "Focus on AI ethics",
      settings: {
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
      } as any,
    };

    const prompt = buildNewsletterPrompt(params);

    // Date range and article count
    expect(prompt).toContain("DATE RANGE:");
    expect(prompt).toContain("ARTICLES (1 total):");

    // Settings context appears
    expect(prompt).toContain("NEWSLETTER SETTINGS:");
    expect(prompt).toContain("Newsletter Name: AI Weekly");
    expect(prompt).toContain("Brand Voice: Confident");
    expect(prompt).toContain("Tags: AI, ML");

    // User instructions section
    expect(prompt).toContain("CRITICAL USER INSTRUCTIONS");
    expect(prompt).toContain("Focus on AI ethics");

    // Requirements and important notes should reflect disclaimer and footer
    expect(prompt).toMatch(/include the required disclaimer text/i);
    expect(prompt).toMatch(/include the required footer content/i);
  });

  it("omits optional sections when settings and input are absent", () => {
    const prompt = buildNewsletterPrompt({
      startDate: new Date("2025-02-01"),
      endDate: new Date("2025-02-28"),
      articleSummaries: "",
      articleCount: 0,
    } as any);

    expect(prompt).not.toContain("NEWSLETTER SETTINGS:");
    expect(prompt).not.toContain("CRITICAL USER INSTRUCTIONS");
  });
});
