import type { ApiHandler, Middleware } from "@/shared/types/api";
import { errorResponse } from "@/shared/utils/response";
import { getRouteSchema } from "@/app/api/router-schemas";

export const requestValidator: Middleware = (handler) => async (ctx) => {
  const schema = getRouteSchema(ctx.method, ctx.path);
  if (!schema) return handler(ctx);

  try {
    if (schema.body) {
      const raw = ctx.body ?? (await ctx.req.clone().json().catch(() => ({})));
      ctx.body = schema.body.parse(raw);
    }
    if (schema.query) {
      const queryObj = Object.fromEntries(ctx.query.entries());
      schema.query.parse(queryObj);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Validation failed";
    return errorResponse(message, 400);
  }

  return handler(ctx);
};
