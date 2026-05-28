"use client";

import { signOut, useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { MaterialIcon } from "../components/MaterialIcon";
import {
  formatRoleBadgeKey,
  getVisibleNavItems,
  isNavActive,
} from "./nav-config";

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

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((open) => !open);
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  useEffect(() => {
    closeSidebar();
  }, [pathname, closeSidebar]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSidebar();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sidebarOpen, closeSidebar]);

  const locale = useLocale();
  const tNav = useTranslations("admin.layout");
  const tRoles = useTranslations("roles");
  const role = session?.user?.role;
  const navItems = getVisibleNavItems(role);
  const displayName = session?.user?.name ?? session?.user?.email ?? "User";
  const displayEmail = session?.user?.email ?? "";
  const initials = getInitials(session?.user?.name, displayEmail);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-surface text-on-surface antialiased">
        <div className="fixed inset-0 z-50 flex">
          <aside className="hidden w-sidebar-width shrink-0 bg-surface-container lg:block" />
          <div className="flex flex-1 flex-col">
            <header className="h-16 border-b border-outline-variant bg-surface" />
            <main className="flex-1 p-lg">
              <div className="mx-auto max-w-container-max animate-pulse space-y-lg">
                <div className="h-10 w-64 rounded-lg bg-surface-container" />
                <div className="grid gap-md md:grid-cols-3">
                  <div className="h-32 rounded-xl bg-surface-container-low" />
                  <div className="h-32 rounded-xl bg-surface-container-low" />
                  <div className="h-32 rounded-xl bg-surface-container-low" />
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-surface text-on-surface antialiased">
      {/* Mobile drawer overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity duration-300 lg:hidden ${
          sidebarOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        onClick={closeSidebar}
        aria-hidden={!sidebarOpen}
      />

      {/* Sidebar */}
      <aside
        id="admin-sidebar"
        className={`fixed bottom-0 left-0 top-0 z-50 flex w-sidebar-width flex-col border-r border-outline-variant bg-surface-container py-lg transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="mb-xl flex items-center gap-sm px-lg">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-container text-on-primary-container">
            <MaterialIcon icon="school" filled className="text-[24px]" />
          </div>
          <div>
            <h1 className="text-headline-md font-black leading-tight text-primary">
              EduAdmin
            </h1>
            <p className="text-body-sm opacity-70 text-on-surface-variant">
              Institutional Management
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-xs overflow-y-auto px-md" aria-label="Admin">
          {navItems.map((item) => {
            const active = isNavActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-md rounded-lg px-md py-sm transition-all duration-200 ${
                  active
                    ? "border-s-4 border-primary bg-secondary-container text-on-secondary-container"
                    : "text-on-surface-variant hover:bg-surface-variant hover:text-on-surface"
                }`}
              >
                <MaterialIcon icon={item.icon} className="text-[24px]" />
                <span className="text-label-md">{tNav(item.labelKey)}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-xs border-t border-outline-variant px-md pt-lg">
          <a
            href="#"
            className="flex items-center gap-md rounded-lg px-md py-sm text-on-surface-variant transition-all hover:bg-surface-variant hover:text-on-surface"
          >
            <MaterialIcon icon="help" className="text-[24px]" />
            <span className="text-label-md">Support</span>
          </a>
          <a
            href="#"
            className="flex items-center gap-md rounded-lg px-md py-sm text-on-surface-variant transition-all hover:bg-surface-variant hover:text-on-surface"
          >
            <MaterialIcon icon="description" className="text-[24px]" />
            <span className="text-label-md">Documentation</span>
          </a>
        </div>
      </aside>

      {/* Top bar */}
      <header className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between border-b border-outline-variant bg-surface px-lg lg:left-sidebar-width">
        <div className="flex items-center gap-md">
          <button
            type="button"
            className="rounded-full p-sm transition-colors hover:bg-surface-container-high lg:hidden"
            onClick={toggleSidebar}
            aria-expanded={sidebarOpen}
            aria-controls="admin-sidebar"
            aria-label="Toggle navigation menu"
          >
            <MaterialIcon icon="menu" className="text-primary" />
          </button>
          <div
            className={`hidden w-64 items-center rounded-full border bg-surface-container px-md py-xs transition-all md:flex ${
              searchFocused
                ? "border-primary ring-1 ring-primary"
                : "border-outline-variant"
            }`}
          >
            <MaterialIcon
              icon="search"
              className="text-[20px] text-on-surface-variant"
            />
            <input
              type="search"
              placeholder={tNav("searchPlaceholder")}
              className="w-full border-none bg-transparent text-body-sm text-on-surface placeholder:text-on-surface-variant/50 focus:ring-0"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              aria-label="Search systems"
            />
          </div>
        </div>

        <div className="flex items-center gap-md">
          <LanguageSwitcher />
          <button
            type="button"
            className="relative rounded-full p-sm transition-colors hover:bg-surface-container-high"
            aria-label="Notifications"
          >
            <MaterialIcon
              icon="notifications"
              className="text-on-surface-variant"
            />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full border border-surface bg-error" />
          </button>
          <button
            type="button"
            className="rounded-full p-sm transition-colors hover:bg-surface-container-high"
            aria-label="Settings"
          >
            <MaterialIcon icon="settings" className="text-on-surface-variant" />
          </button>
          <div className="mx-xs h-8 w-px bg-outline-variant" />
          <div className="flex items-center gap-sm">
            <div className="hidden text-right sm:block">
              <p className="text-label-md leading-tight text-on-surface">
                {displayName}
              </p>
              {role && (
                <span className="rounded bg-primary-container/20 px-xs py-[1px] text-[10px] font-bold uppercase tracking-wider text-primary">
                  {tRoles(formatRoleBadgeKey(role))}
                </span>
              )}
            </div>
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary-container bg-surface-container-highest text-sm font-bold text-primary"
              title={displayEmail}
              aria-hidden
            >
              {initials}
            </div>
          </div>
          <button
            type="button"
            className="flex scale-[0.98] items-center gap-xs rounded-lg bg-surface-container-high px-md py-sm text-on-surface transition-all hover:bg-surface-variant active:opacity-80"
            onClick={() => signOut({ callbackUrl: `/${locale}/login` })}
          >
            <MaterialIcon icon="logout" className="text-[18px]" />
            <span className="hidden text-label-md sm:inline">
              {tNav("signOut")}
            </span>
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="min-h-screen pt-16 lg:pl-sidebar-width">
        <div className="mx-auto max-w-container-max space-y-lg p-lg">{children}</div>
      </main>
    </div>
  );
}
