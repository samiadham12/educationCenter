import type { ApiHandler, Middleware } from "@/shared/types/api";
import { errorResponse } from "@/shared/utils/response";
import { ADMIN_ROLES, STAFF_ROLES, type Role } from "@/shared/constants/roles";

const buckets = new Map<string, { count: number; resetAt: number }>();

function getLimit(ctx: { path: string; user?: { role: Role } }): number {
  const role = ctx.user?.role;

  if (
    ctx.path.startsWith("/api/admin") ||
    (role && ADMIN_ROLES.includes(role))
  ) {
    return Number(process.env.RATE_LIMIT_ADMIN ?? 500);
  }

  if (role && STAFF_ROLES.includes(role)) {
    return Number(process.env.RATE_LIMIT_AUTH ?? 100);
  }

  if (ctx.user) {
    return Number(process.env.RATE_LIMIT_AUTH ?? 100);
  }

  return Number(process.env.RATE_LIMIT_PUBLIC ?? 10);
}

export const rateLimiter: Middleware = (handler) => async (ctx) => {
  if (
    process.env.NODE_ENV === "development" &&
    process.env.RATE_LIMIT_ENABLED !== "true"
  ) {
    return handler(ctx);
  }

  const key = `${ctx.ip}:${ctx.path}:${ctx.user?.id ?? "anon"}`;
  const now = Date.now();
  const windowMs = 60_000;
  const limit = getLimit(ctx);

  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return errorResponse("Too many requests", 429);
  }

  return handler(ctx);
};
