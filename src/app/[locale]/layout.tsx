import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Inter, IBM_Plex_Sans_Arabic } from "next/font/google";
import { hasLocale } from "next-intl";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { routing } from "@/i18n/routing";
import { isRtlLocale } from "@/shared/i18n/rtl";
import "../globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const arabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: "EduCenter — Education Center Platform",
  description:
    "Secure academic platform for protected lectures, codes, and institutional administration.",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();
  const direction = isRtlLocale(locale) ? "rtl" : "ltr";
  const fontClass =
    direction === "rtl"
      ? `${arabic.variable} font-arabic`
      : `${inter.variable} font-sans`;

  return (
    <html lang={locale} dir={direction} className={`dark ${fontClass}`}>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0..1,0&display=swap"
        />
      </head>
      <body
        className="bg-surface text-on-surface antialiased"
        style={{
          fontFamily:
            direction === "rtl"
              ? "var(--font-arabic), system-ui, sans-serif"
              : "var(--font-inter), system-ui, sans-serif",
        }}
      >
        <NextIntlClientProvider messages={messages}>
          <AuthSessionProvider>{children}</AuthSessionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
