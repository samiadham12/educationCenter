import type { ApiHandler, Middleware } from "@/shared/types/api";
import { errorResponse } from "@/shared/utils/response";

export const ipWhitelist: Middleware = (handler) => async (ctx) => {
  const whitelist = process.env.ADMIN_IP_WHITELIST?.split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!whitelist?.length || !ctx.path.startsWith("/api/admin")) {
    return handler(ctx);
  }

  if (!whitelist.includes(ctx.ip)) {
    return errorResponse("IP not allowed", 403);
  }

  return handler(ctx);
};
