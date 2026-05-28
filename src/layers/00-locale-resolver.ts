import type { Middleware } from "@/shared/types/api";
import { resolveLocaleFromRequest } from "@/shared/i18n/resolve-locale";

export const localeResolver: Middleware = (handler) => async (ctx) => {
  const headerLocale = ctx.req.headers.get("x-locale");
  ctx.locale =
    headerLocale && headerLocale.length > 0
      ? headerLocale
      : resolveLocaleFromRequest(ctx.req);
  return handler(ctx);
};
