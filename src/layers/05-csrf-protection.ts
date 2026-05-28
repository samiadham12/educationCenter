import { createHmac, timingSafeEqual } from "crypto";
import type { ApiHandler, Middleware } from "@/shared/types/api";
import { errorResponse } from "@/shared/utils/response";

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const CSRF_EXEMPT = new Set([
  "POST /api/auth/login",
  "POST /api/auth/signup",
]);

export const csrfProtection: Middleware = (handler) => async (ctx) => {
  if (!MUTATING.has(ctx.method)) return handler(ctx);

  const routeKey = `${ctx.method} ${ctx.path}`;
  if (CSRF_EXEMPT.has(routeKey)) return handler(ctx);

  const authHeader = ctx.req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) return handler(ctx);

  const rawCookie = ctx.req.headers
    .get("cookie")
    ?.match(/(?:^|;\s*)csrf-token=([^;]*)/)?.[1];
  const cookieToken = rawCookie
    ? decodeURIComponent(rawCookie.trim())
    : undefined;
  const headerToken = ctx.req.headers.get("x-csrf-token")?.trim();

  if (!cookieToken || !headerToken) {
    return errorResponse("CSRF token missing", 403);
  }

  // Double-submit: same raw value in httpOnly cookie and header
  if (headerToken === cookieToken) {
    return handler(ctx);
  }

  const secret = (process.env.CSRF_SECRET ?? "csrf-dev").trim();
  const expected = createHmac("sha256", secret)
    .update(cookieToken)
    .digest("hex");

  try {
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(headerToken, "utf8");
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return errorResponse("Invalid CSRF token", 403);
    }
  } catch {
    return errorResponse("Invalid CSRF token", 403);
  }

  return handler(ctx);
};
