export type LocaleDefinition = {
  code: string;
  nativeName: string;
  englishName: string;
  direction: "ltr" | "rtl";
  enabled: boolean;
  fallback?: string;
};

export const LOCALES: LocaleDefinition[] = [
  {
    code: "en",
    nativeName: "English",
    englishName: "English",
    direction: "ltr",
    enabled: true,
  },
  {
    code: "ar",
    nativeName: "العربية",
    englishName: "Arabic",
    direction: "rtl",
    enabled: true,
  },
];

const enabledFromEnv = process.env.ENABLED_LOCALES?.split(",").map((s) => s.trim());

export function getEnabledLocales(): LocaleDefinition[] {
  const list = LOCALES.filter((l) => l.enabled);
  if (!enabledFromEnv?.length) return list;
  return list.filter((l) => enabledFromEnv.includes(l.code));
}

export function getEnabledLocaleCodes(): string[] {
  return getEnabledLocales().map((l) => l.code);
}

export function getDefaultLocale(): string {
  return process.env.DEFAULT_LOCALE ?? "en";
}

export function isValidLocale(code: string): boolean {
  return getEnabledLocaleCodes().includes(code);
}

export function getLocaleDefinition(
  code: string,
): LocaleDefinition | undefined {
  return LOCALES.find((l) => l.code === code);
}
