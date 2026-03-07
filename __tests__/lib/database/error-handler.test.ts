import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  handleDatabaseError,
  handlePrismaError,
  isPrismaError,
  wrapDatabaseOperation,
} from "@/lib/database/error-handler";

function makePrismaError(code: string) {
  return new Prisma.PrismaClientKnownRequestError("test error", {
    code,
    clientVersion: "test-client",
  });
}

describe("database error handler", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("detects Prisma known request errors", () => {
    expect(isPrismaError(makePrismaError("P2002"))).toBe(true);
    expect(isPrismaError(new Error("not prisma"))).toBe(false);
  });

  it("maps known Prisma error codes to friendly messages", () => {
    expect(handlePrismaError(makePrismaError("P2002"), "Create user").message).toBe(
      "Create user: Duplicate entry found",
    );
    expect(handlePrismaError(makePrismaError("P2025"), "Load user").message).toBe(
      "Load user: Record not found",
    );
    expect(handlePrismaError(makePrismaError("P2003"), "Delete relation").message).toBe(
      "Delete relation: Foreign key constraint failed",
    );
    expect(handlePrismaError(makePrismaError("P9999"), "Update profile").message).toBe(
      "Update profile: Database error (P9999)",
    );
  });

  it("throws wrapped messages for generic errors", () => {
    expect(() => handleDatabaseError(new Error("boom"), "save settings")).toThrow(
      "Failed to save settings: boom",
    );
  });

  it("throws Prisma-specific friendly messages", () => {
    expect(() =>
      handleDatabaseError(makePrismaError("P2002"), "create article"),
    ).toThrow("Failed to create article: Duplicate entry found");
  });

  it("returns operation result when wrapped operation succeeds", async () => {
    await expect(
      wrapDatabaseOperation(async () => "ok", "fetch user"),
    ).resolves.toBe("ok");
  });

  it("rethrows wrapped error when wrapped operation fails", async () => {
    await expect(
      wrapDatabaseOperation(async () => {
        throw new Error("timeout");
      }, "fetch feed"),
    ).rejects.toThrow("Failed to fetch feed: timeout");
  });

  it("rethrows friendly Prisma message from wrapped operation", async () => {
    await expect(
      wrapDatabaseOperation(async () => {
        throw makePrismaError("P2025");
      }, "load feed"),
    ).rejects.toThrow("Failed to load feed: Record not found");
  });
});
