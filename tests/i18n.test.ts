import { describe, expect, it } from "vitest";
import {
  getLocaleFromCookie,
  parseAcceptLanguage,
  resolveLocale,
} from "@/shared/i18n/resolve-locale";
import { isRtlLocale } from "@/shared/i18n/rtl";
import { localizeField } from "@/features/translations/services/translation.service";

describe("resolveLocale", () => {
  it("prefers user preferredLocale", () => {
    expect(
      resolveLocale({
        preferredLocale: "ar",
        cookieHeader: "NEXT_LOCALE=en",
        acceptLanguage: "fr",
      }),
    ).toBe("ar");
  });

  it("falls back to cookie then Accept-Language then default", () => {
    expect(
      resolveLocale({
        cookieHeader: "NEXT_LOCALE=ar",
        acceptLanguage: "en",
      }),
    ).toBe("ar");
    expect(resolveLocale({ acceptLanguage: "ar,en;q=0.9" })).toBe("ar");
    expect(resolveLocale({})).toBe("en");
  });
});

describe("getLocaleFromCookie", () => {
  it("reads NEXT_LOCALE cookie", () => {
    expect(getLocaleFromCookie("NEXT_LOCALE=ar; other=1")).toBe("ar");
  });
});

describe("parseAcceptLanguage", () => {
  it("parses quality values", () => {
    expect(parseAcceptLanguage("en;q=0.5,ar;q=0.9")).toBe("ar");
  });
});

describe("isRtlLocale", () => {
  it("returns true for Arabic", () => {
    expect(isRtlLocale("ar")).toBe(true);
  });
  it("returns false for English", () => {
    expect(isRtlLocale("en")).toBe(false);
  });
});

describe("localizeField", () => {
  it("resolves requested locale then default then raw", () => {
    const map = new Map<string, string>([
      ["en.name", "First Year"],
      ["ar.name", "السنة الأولى"],
    ]);
    expect(localizeField("Fallback", map, "ar", "name")).toBe("السنة الأولى");
    expect(localizeField("Fallback", map, "fr", "name", "en")).toBe(
      "First Year",
    );
    expect(localizeField("Fallback", map, "fr", "name", "de")).toBe("Fallback");
  });
});
