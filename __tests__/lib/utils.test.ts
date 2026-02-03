import { describe, expect, it } from "vitest"
import { cn } from "@/lib/utils"

describe("cn", () => {
  it("merges class names and ignores falsy values", () => {
    const result = cn("text-sm", "font-medium", false && "hidden", undefined)
    expect(result).toContain("text-sm")
    expect(result).toContain("font-medium")
    expect(result).not.toContain("hidden")
  })

  it("resolves Tailwind conflicting classes using tailwind-merge", () => {
    const result = cn("px-2", "px-4")
    expect(result).toBe("px-4")
  })
})
