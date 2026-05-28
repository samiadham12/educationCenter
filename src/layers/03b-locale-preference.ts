import type { Middleware } from "@/shared/types/api";
import { resolveLocale } from "@/shared/i18n/resolve-locale";

/** After auth: prefer the authenticated user's stored locale for API messages. */
export const localePreference: Middleware = (handler) => async (ctx) => {
  if (ctx.user?.preferredLocale) {
    ctx.locale = resolveLocale({
      preferredLocale: ctx.user.preferredLocale,
      cookieHeader: ctx.req.headers.get("cookie"),
      acceptLanguage: ctx.req.headers.get("accept-language"),
    });
  }
  return handler(ctx);
};
