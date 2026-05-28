import { getDefaultLocale, isValidLocale } from "./locales";

export function stripLocalePrefix(pathname: string): {
  locale: string;
  pathname: string;
} {
  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];
  if (first && isValidLocale(first)) {
    const rest = segments.slice(1).join("/");
    return {
      locale: first,
      pathname: rest ? `/${rest}` : "/",
    };
  }
  return {
    locale: getDefaultLocale(),
    pathname: pathname || "/",
  };
}
