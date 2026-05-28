"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useSession } from "next-auth/react";
import { useTransition } from "react";
import { getEnabledLocales } from "@/shared/i18n/locales";
import { LOCALE_COOKIE } from "@/shared/i18n/resolve-locale";

function setLocaleCookie(locale: string) {
  document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=31536000;SameSite=Lax`;
}

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const t = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const [pending, startTransition] = useTransition();
  const locales = getEnabledLocales();

  async function onChange(nextLocale: string) {
    if (nextLocale === locale) return;
    setLocaleCookie(nextLocale);

    if (session?.user?.id) {
      await fetch("/api/users/me/locale", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json", "X-Locale": nextLocale },
        body: JSON.stringify({ locale: nextLocale }),
      }).catch(() => undefined);
    }

    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
      router.refresh();
    });
  }

  return (
    <label className={`inline-flex items-center gap-2 ${className}`}>
      <span className="sr-only">{t("selectLanguage")}</span>
      <span className="text-body-sm text-on-surface-variant" aria-hidden>
        {t("language")}
      </span>
      <select
        value={locale}
        disabled={pending}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 rounded border border-outline-variant bg-surface-container-lowest px-2 text-body-sm text-on-surface outline-none focus:border-primary"
        aria-label={t("selectLanguage")}
      >
        {locales.map((l) => (
          <option key={l.code} value={l.code}>
            {l.nativeName}
          </option>
        ))}
      </select>
    </label>
  );
}
