
import type { NextRequest } from "next/server";
import { createOpenAI, openai } from "@ai-sdk/openai";
import { streamObject } from "ai";
import { getUserSettingsByUserId } from "@/actions/user-settings";
import { getCurrentUser } from "@/lib/auth/helpers";
import {
  buildArticleSummaries,
  buildNewsletterPrompt,
} from "@/lib/newsletter/prompt-builder";
import { prepareFeedsAndArticles } from "@/lib/rss/feed-refresh";
import { NewsletterSchema } from "@/lib/newsletter/types";

export const maxDuration = 300; // 5 minutes for Vercel Pro


/**
 * POST /api/newsletter/generate-stream
 *
 * Streams newsletter generation in real-time using Vercel AI SDK.
 * The AI SDK handles all streaming complexity automatically.
 *
 * @returns AI SDK text stream response
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { feedIds, startDate, endDate, userInput } = body;

    // Validate required parameters
    if (!feedIds || !Array.isArray(feedIds) || feedIds.length === 0) {
      return Response.json(
        { error: "feedIds is required and must be a non-empty array" },
        { status: 400 },
      );
    }

    if (!startDate || !endDate) {
      return Response.json(
        { error: "startDate and endDate are required" },
        { status: 400 },
      );
    }

    console.log("Starting newsletter generation for feeds:", feedIds);
    // Get authenticated user and settings
    const user = await getCurrentUser();
    const settings = await getUserSettingsByUserId(user.id);

    // Fetch and prepare articles
    const articles = await prepareFeedsAndArticles({
      feedIds,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    });

    // Build the AI prompt
    const articleSummaries = buildArticleSummaries(articles);
    const prompt = buildNewsletterPrompt({
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      articleSummaries,
      articleCount: articles.length,
      userInput,
      settings,
    });

    // Configure OpenRouter as the provider (replace with your API key)
    const openRouter = createOpenAI({
      baseURL: process.env.OPENROUTER_API_BASE_URL,
      apiKey: process.env.OPENROUTER_API_KEY, // Add this to your .env file
    });
    // Stream newsletter generation with AI SDK
    const result = streamObject({
      model: openRouter("tngtech/deepseek-r1t2-chimera:free"),
      schema: NewsletterSchema,
      prompt,
      onFinish: async () => {
        // Optional: Add any post-generation logic here
      },
    });

    // Return AI SDK's native stream response
    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Error in generate-stream:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return Response.json(
      { error: `Failed to generate newsletter: ${errorMessage}` },
      { status: 500 },
    );
  }
}