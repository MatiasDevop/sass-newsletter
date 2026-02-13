"use server";

//import { openai } from "@ai-sdk/openai";
import { createOpenAI } from "@ai-sdk/openai"; // Import the flexible OpenAI provider creator
import { streamObject } from "ai";
import { checkIsProUser, getCurrentUser } from "@/lib/auth/helpers";
import {
  buildArticleSummaries,
  buildNewsletterPrompt,
} from "@/lib/newsletter/prompt-builder";
import { prepareFeedsAndArticles } from "@/lib/rss/feed-refresh";
import { createNewsletter } from "./newsletter";
import { getUserSettingsByUserId } from "./user-settings";
import {
  NewsletterSchema,
  type GeneratedNewsletter,
} from "@/lib/newsletter/types";

// ============================================
// NEWSLETTER GENERATION ACTIONS
// ============================================

// Schema and type moved to lib/newsletter/schema to satisfy Next.js server action export constraints.

/**
 * Generates a newsletter with AI streaming
 *
 * This is the main function for newsletter generation. It:
 * 1. Authenticates the user
 * 2. Fetches user settings for customization
 * 3. Prepares feeds and retrieves articles
 * 4. Builds an AI prompt with all context
 * 5. Streams the AI-generated newsletter in real-time
 *
 * @param params - Feed IDs, date range, and optional user instructions
 * @returns Object with the stream and article count
 */
export async function generateNewsletterStream(params: {
  feedIds: string[];
  startDate: Date;
  endDate: Date;
  userInput?: string;
}) {
  // Get authenticated user from database
  const user = await getCurrentUser();

  // Get user's newsletter settings (tone, branding, etc.)
  const settings = await getUserSettingsByUserId(user.id);

  // Fetch and refresh articles from RSS feeds
  const articles = await prepareFeedsAndArticles(params);

  // Build the AI prompt with articles and settings
  const articleSummaries = buildArticleSummaries(articles);
  const prompt = buildNewsletterPrompt({
    startDate: params.startDate,
    endDate: params.endDate,
    articleSummaries,
    articleCount: articles.length,
    userInput: params.userInput,
    settings,
  });

  // Configure OpenRouter as the provider (replace with your API key)
  const openRouter = createOpenAI({
    baseURL: process.env.OPENROUTER_API_BASE_URL,
    apiKey: process.env.OPENROUTER_API_KEY, // Add this to your .env file
  });

  // Generate newsletter using AI with streaming for real-time updates
  const { partialObjectStream } = await streamObject({
    model: openRouter("tngtech/deepseek-r1t2-chimera:free"),
    schema: NewsletterSchema,
    prompt,
  });

  return {
    stream: partialObjectStream,
    articlesAnalyzed: articles.length,
  };
}

/**
 * Saves a generated newsletter to the database
 *
 * Only Pro users can save newsletters to their history.
 * This allows them to reference past newsletters and track their content.
 *
 * @param params - Newsletter data and generation parameters
 * @returns Saved newsletter record
 * @throws Error if user is not Pro or not authenticated
 */
export async function saveGeneratedNewsletter(params: {
  newsletter: GeneratedNewsletter;
  feedIds: string[];
  startDate: Date;
  endDate: Date;
  userInput?: string;
}) {
  // Check if user has Pro plan (required for saving)
  const isPro = await checkIsProUser();
  if (!isPro) {
    throw new Error("Pro plan required to save newsletters");
  }

  // Get authenticated user
  const user = await getCurrentUser();

  // Save newsletter to database
  const savedNewsletter = await createNewsletter({
    userId: user.id,
    suggestedTitles: params.newsletter.suggestedTitles,
    suggestedSubjectLines: params.newsletter.suggestedSubjectLines,
    body: params.newsletter.body,
    topAnnouncements: params.newsletter.topAnnouncements,
    additionalInfo: params.newsletter.additionalInfo,
    startDate: params.startDate,
    endDate: params.endDate,
    userInput: params.userInput,
    feedsUsed: params.feedIds,
  });

  return savedNewsletter;
}
