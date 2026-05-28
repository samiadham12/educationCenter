import { createHmac, randomBytes } from "crypto";

export function generateLectureCode(length = 12): string {
  const len = Number(process.env.LECTURE_CODE_LENGTH ?? length);
  // Ensure we always return the requested length.
  // Some encodings/filters can shorten the string, so we accumulate until we have enough.
  let out = "";
  while (out.length < len) {
    out += randomBytes(12)
      .toString("base64url")
      .replace(/[^a-zA-Z0-9]/g, "");
  }
  return out.slice(0, len).toUpperCase();
}

export function signStreamToken(payload: Record<string, unknown>): string {
  const secret = process.env.APP_SECRET ?? "dev-secret";
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyStreamToken(
  token: string,
): Record<string, unknown> | null {
  const secret = process.env.APP_SECRET ?? "dev-secret";
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", secret).update(body).digest("base64url");
  if (sig !== expected) return null;
  try {
    const parsed = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as Record<string, unknown>;
    const exp = parsed.exp as number | undefined;
    if (exp && exp < Math.floor(Date.now() / 1000)) return null;
    return parsed;
  } catch {
    return null;
  }
}
