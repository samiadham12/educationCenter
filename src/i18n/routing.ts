import { defineRouting } from "next-intl/routing";
import { getDefaultLocale, getEnabledLocaleCodes } from "@/shared/i18n/locales";

export const routing = defineRouting({
  locales: getEnabledLocaleCodes(),
  defaultLocale: getDefaultLocale(),
  localePrefix: "always",
});
