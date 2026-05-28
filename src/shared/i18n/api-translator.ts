import { getDefaultLocale, isValidLocale } from "./locales";
import { loadMessages } from "./load-messages";

type MessagesCache = Map<string, Record<string, unknown>>;

const cache: MessagesCache = new Map();

async function getErrorMessages(
  locale: string,
): Promise<Record<string, string>> {
  const key = locale;
  if (!cache.has(key)) {
    const messages = await loadMessages(locale);
    const errors = messages.errors as Record<string, string> | undefined;
    cache.set(key, errors ?? {});
  }
  return cache.get(key) as Record<string, string>;
}

function resolveNestedKey(
  obj: Record<string, unknown>,
  path: string,
): string | undefined {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "string" ? current : undefined;
}

/** Server-side translation for API error messages (errors namespace). */
export async function apiTranslate(
  errorCode: string,
  locale: string,
  fallback: string,
): Promise<string> {
  const resolvedLocale = isValidLocale(locale) ? locale : getDefaultLocale();
  try {
    const errors = await getErrorMessages(resolvedLocale);
    const direct = errors[errorCode];
    if (typeof direct === "string") return direct;
    const nested = resolveNestedKey(errors, errorCode);
    if (nested) return nested;
  } catch {
    /* fall through */
  }
  return fallback;
}
