import { hasPermission, type Permission } from "@/shared/constants/permissions";
import type { ApiHandler, Middleware } from "@/shared/types/api";
import { errorResponse } from "@/shared/utils/response";
import { getRoutePermission } from "@/app/api/router-schemas";

export const roleGuard: Middleware = (handler) => async (ctx) => {
  const permission = getRoutePermission(ctx.method, ctx.path) as
    | Permission
    | undefined;

  if (!permission) return handler(ctx);
  if (!ctx.user) return errorResponse("Unauthorized", 401);

  if (!hasPermission(ctx.user.role, permission)) {
    return errorResponse(
      `Forbidden: role ${ctx.user.role} lacks ${permission}`,
      403,
    );
  }

  return handler(ctx);
};
