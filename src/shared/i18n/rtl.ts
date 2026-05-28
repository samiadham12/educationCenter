import { getLocaleDefinition } from "./locales";

export function isRtlLocale(code: string): boolean {
  return getLocaleDefinition(code)?.direction === "rtl";
}
