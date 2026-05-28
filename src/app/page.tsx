import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { resolveLocale } from "@/shared/i18n/resolve-locale";

export default async function RootRedirectPage() {
  const h = await headers();
  const locale = resolveLocale({
    cookieHeader: h.get("cookie"),
    acceptLanguage: h.get("accept-language"),
  });
  redirect(`/${locale}`);
}
