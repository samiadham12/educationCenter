"use client";

import { signOut, useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { MaterialIcon } from "../components/MaterialIcon";

const navLinks = [
  {
    href: "/student" as const,
    labelKey: "browse" as const,
    icon: "grid_view",
    exact: true,
  },
  {
    href: "/student/code" as const,
    labelKey: "enterCode" as const,
    icon: "vpn_key",
    exact: false,
  },
];

function isNavActive(pathname: string, href: string, exact: boolean): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function getInitials(name: string | null | undefined, email: string): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("student.layout");
  const { data: session, status } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    closeMobile();
  }, [pathname, closeMobile]);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.replace(`/${locale}/login`);
      return;
    }
  }, [status, session, router]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMobile();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen, closeMobile]);

  const displayName = session?.user?.name ?? session?.user?.email ?? "Student";
  const displayEmail = session?.user?.email ?? "";
  const initials = getInitials(session?.user?.name, displayEmail);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-900/95">
          <div className="mx-auto flex h-16 max-w-container-max items-center px-lg">
            <div className="loading-shimmer h-6 w-40 rounded" />
          </div>
        </header>
        <main className="mx-auto max-w-container-max animate-pulse space-y-lg p-lg">
          <div className="h-8 w-64 rounded bg-slate-800" />
          <div className="h-48 rounded-xl bg-slate-800/80" />
        </main>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  const navLinkClass = (active: boolean) =>
    `text-label-md transition-colors duration-200 ${
      active
        ? "border-b-2 border-emerald-500 pb-1 font-bold text-emerald-400"
        : "text-slate-400 hover:text-emerald-400"
    }`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased">
      {/* Top navigation */}
      <nav className="sticky top-0 z-50 border-b border-slate-800 bg-slate-900/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-container-max flex-col px-lg">
          <div className="flex h-16 items-center justify-between gap-md">
            <LanguageSwitcher className="order-last lg:order-none" />
            <div className="flex items-center gap-md lg:gap-xl">
              <button
                type="button"
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-emerald-400 lg:hidden"
                onClick={() => setMobileOpen((o) => !o)}
                aria-expanded={mobileOpen}
                aria-label="Toggle menu"
              >
                <MaterialIcon icon="menu" />
              </button>
              <Link
                href="/student"
                className="flex items-center gap-sm text-headline-lg font-bold text-emerald-400"
              >
                <MaterialIcon icon="school" filled className="text-[28px]" />
                <span className="hidden sm:inline">Education Center</span>
              </Link>
              <div className="hidden items-center gap-lg md:flex">
                {navLinks.map((link) => {
                  const active = isNavActive(
                    pathname,
                    link.href,
                    link.exact,
                  );
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={navLinkClass(active)}
                    >
                      {t(link.labelKey)}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-md">
              <div className="hidden items-center gap-sm sm:flex">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-emerald-500/50 bg-emerald-500/10 text-sm font-bold text-emerald-400">
                  {initials}
                </div>
                <div className="hidden text-right md:block">
                  <p className="text-label-md leading-tight text-slate-100">
                    {displayName}
                  </p>
                  <p className="text-label-sm text-slate-500">{t("student")}</p>
                </div>
              </div>
              <button
                type="button"
                className="flex items-center gap-sm rounded-lg px-md py-sm text-slate-400 transition-colors hover:bg-slate-800 hover:text-red-400"
                onClick={() => signOut({ callbackUrl: `/${locale}/login` })}
              >
                <MaterialIcon icon="logout" />
                <span className="hidden text-label-md sm:inline">
                  {t("signOut")}
                </span>
              </button>
            </div>
          </div>

          {/* Year / portal banner */}
          <div className="border-t border-slate-800/80 py-2">
            <p className="text-body-sm text-slate-400">
              <span className="font-medium text-slate-300">Current Year:</span>{" "}
              <span className="text-emerald-400/90">Student Portal</span>
              <span className="mx-2 text-slate-600">·</span>
              {displayEmail}
            </p>
          </div>
        </div>

        {/* Mobile nav */}
        <div
          className={`border-t border-slate-800 bg-slate-900 md:hidden ${
            mobileOpen ? "block" : "hidden"
          }`}
        >
          <div className="flex flex-col gap-1 px-lg py-md">
            {navLinks.map((link) => {
              const active = isNavActive(pathname, link.href, link.exact);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-md rounded-lg px-md py-sm text-label-md transition-colors ${
                    active
                      ? "border-l-4 border-emerald-500 bg-emerald-500/10 text-emerald-400"
                      : "text-slate-400 hover:bg-slate-800 hover:text-emerald-400"
                  }`}
                  onClick={closeMobile}
                >
                  <MaterialIcon icon={link.icon} />
                  {t(link.labelKey)}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="min-h-[calc(100vh-6.5rem)] bg-slate-900/40">
        <div className="mx-auto w-full max-w-container-max px-lg py-lg">
          {children}
        </div>
      </main>
    </div>
  );
}
