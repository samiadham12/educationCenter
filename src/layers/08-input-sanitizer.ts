import type { ApiHandler, Middleware } from "@/shared/types/api";

const NOSQL_PATTERN = /\$(?:where|gt|gte|lt|lte|ne|in|nin|or|and|not|nor|exists|type|regex)/i;

function sanitizeValue(value: unknown): unknown {
  if (typeof value === "string") {
    if (NOSQL_PATTERN.test(value)) return value.replace(/\$/g, "");
    return value.trim();
  }
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      if (k.startsWith("$")) continue;
      out[k] = sanitizeValue(v);
    }
    return out;
  }
  return value;
}

export const inputSanitizer: Middleware = (handler) => async (ctx) => {
  if (ctx.body && typeof ctx.body === "object") {
    ctx.body = sanitizeValue(ctx.body);
  }
  return handler(ctx);
};
