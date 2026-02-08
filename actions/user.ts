"use server";

import { wrapDatabaseOperation } from "@/lib/database/error-handler";
import { prisma } from "@/lib/prisma";

// ============================================
// USER ACTIONS
// ============================================

/**
 * Fetches a user by their Clerk user ID
 *
 * @param clerkUserId - The Clerk authentication ID
 * @returns User record or null if not found
 */
export async function getUserByClerkId(clerkUserId: string) {
  return wrapDatabaseOperation(async () => {
    return await prisma.user.findUnique({
      where: { clerkUserId },
    });
  }, "fetch user by Clerk ID");
}

/**
 * Creates a user if they don't exist, or returns the existing user
 * Updates the timestamp when user already exists (tracks last activity)
 *
 * Note: Uses findUnique + create pattern instead of upsert to avoid transactions
 * (MongoDB Atlas free tier M0 doesn't support transactions)
 *
 * @param clerkUserId - The Clerk authentication ID
 * @returns User record (either created or existing)
 */
export async function upsertUserFromClerk(clerkUserId: string) {
  return wrapDatabaseOperation(async () => {
    // Try to find existing user
    console.log("Checking for existing user with Clerk ID:", clerkUserId);
    const existingUser = await prisma.user.findUnique({
      where: { clerkUserId },
    });
    console.log("Existing user found:", existingUser);
    if (existingUser) {
      // Update timestamp for existing user
      return await prisma.user.update({
        where: { clerkUserId },
        data: {
          updatedAt: new Date(),
        },
      });
    }

    // Create new user if doesn't exist
    console.log("No existing user found. Creating new user with Clerk ID:", clerkUserId);
    return await prisma.user.create({
      data: {
        clerkUserId,
      },
    });
  }, "upsert user");
}