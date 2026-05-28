import { describe, it, expect } from "vitest";
import { generateLectureCode, signStreamToken, verifyStreamToken } from "@/shared/utils/crypto";

describe("crypto utils", () => {
  it("generates lecture codes of configured length", () => {
    process.env.LECTURE_CODE_LENGTH = "12";
    const code = generateLectureCode();
    expect(code.length).toBe(12);
    expect(code).toMatch(/^[A-Z0-9]+$/);
  });

  it("signs and verifies stream tokens", () => {
    process.env.APP_SECRET = "test-secret-key-for-stream-tokens";
    const token = signStreamToken({
      mediaId: "m1",
      userId: "u1",
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    const payload = verifyStreamToken(token);
    expect(payload?.mediaId).toBe("m1");
    expect(payload?.userId).toBe("u1");
  });
});
