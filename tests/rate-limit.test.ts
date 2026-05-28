import { describe, it, expect } from "vitest";
import { checkRateLimit } from "@/shared/utils/rate-limit-key";

describe("rate limit", () => {
  it("blocks after limit exceeded", () => {
    const key = `test-${Date.now()}`;
    expect(checkRateLimit(key, 3, 60_000)).toBe(true);
    expect(checkRateLimit(key, 3, 60_000)).toBe(true);
    expect(checkRateLimit(key, 3, 60_000)).toBe(true);
    expect(checkRateLimit(key, 3, 60_000)).toBe(false);
  });
});
