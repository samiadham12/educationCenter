import { getDefaultLocale, isValidLocale } from "./locales";

const LOCALE_COOKIE = "NEXT_LOCALE";

export function parseAcceptLanguage(header: string | null): string | null {
  if (!header) return null;
  const parts = header.split(",").map((part) => {
    const [lang, qPart] = part.trim().split(";q=");
    return { lang: lang.split("-")[0].toLowerCase(), q: qPart ? parseFloat(qPart) : 1 };
  });
  parts.sort((a, b) => b.q - a.q);
  for (const { lang } of parts) {
    if (isValidLocale(lang)) return lang;
    const full = header.split(",")[0]?.trim().split("-")[0];
    if (full && isValidLocale(full)) return full;
  }
  const first = parts[0]?.lang;
  if (first && isValidLocale(first)) return first;
  return null;
}

export function getLocaleFromCookie(
  cookieHeader: string | null | undefined,
): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`${LOCALE_COOKIE}=([^;]+)`));
  const value = match?.[1]?.trim();
  if (value && isValidLocale(value)) return value;
  return null;
}

export type ResolveLocaleInput = {
  preferredLocale?: string | null;
  cookieHeader?: string | null;
  acceptLanguage?: string | null;
};

/** Priority: user preference → cookie → Accept-Language → default. */
export function resolveLocale(input: ResolveLocaleInput = {}): string {
  if (input.preferredLocale && isValidLocale(input.preferredLocale)) {
    return input.preferredLocale;
  }
  const fromCookie = getLocaleFromCookie(input.cookieHeader ?? null);
  if (fromCookie) return fromCookie;
  const fromHeader = parseAcceptLanguage(input.acceptLanguage ?? null);
  if (fromHeader) return fromHeader;
  const fallback = getDefaultLocale();
  return isValidLocale(fallback) ? fallback : "en";
}

export function resolveLocaleFromRequest(req: Request): string {
  return resolveLocale({
    cookieHeader: req.headers.get("cookie"),
    acceptLanguage: req.headers.get("accept-language"),
  });
}

export { LOCALE_COOKIE };
