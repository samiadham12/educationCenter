import type { ApiHandler, Middleware } from "@/shared/types/api";
import { isPublicApiRoute } from "@/shared/constants/public-routes";
import { resolveSessionUser } from "@/features/auth/resolve-session-user";
import { errorResponse } from "@/shared/utils/response";

export const authGuard: Middleware = (handler) => async (ctx) => {
  if (isPublicApiRoute(ctx.method, ctx.path)) return handler(ctx);

  let user;
  try {
    user = await resolveSessionUser(ctx.req);
  } catch (err) {
    const { apiErrorToResponse } = await import("@/shared/utils/api-error");
    return apiErrorToResponse(err, { method: ctx.method, path: ctx.path });
  }
  if (!user) {
    return errorResponse("Unauthorized", 401);
  }

  ctx.user = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    preferredLocale: user.preferredLocale,
  };
  ctx.sessionId = user.sessionId;

  return handler(ctx);
};
