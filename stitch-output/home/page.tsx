"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { MaterialIcon } from "../components/MaterialIcon";

const FEATURES = [
  {
    icon: "play_circle",
    title: "Protected streaming",
    description:
      "Watch lectures with HLS video, audio, and inline PDF — progress saved automatically.",
  },
  {
    icon: "vpn_key",
    title: "Lecture codes",
    description:
      "Redeem instructor codes to unlock individual lectures instantly.",
  },
  {
    icon: "account_tree",
    title: "Structured curriculum",
    description:
      "Browse content by academic year, term, subject, section, and lecture.",
  },
  {
    icon: "admin_panel_settings",
    title: "Institutional admin",
    description:
      "Staff manage users, hierarchy, media uploads, subscriptions, and analytics.",
  },
] as const;

function dashboardHref(role: string | undefined): string {
  if (role === "STUDENT") return "/student";
  if (
    role === "ADMIN" ||
    role === "MODERATOR" ||
    role === "SUPER_ADMIN"
  ) {
    return "/admin";
  }
  return "/student";
}

export default function HomePage() {
  const { data: session, status } = useSession();
  const isAuthed = status === "authenticated";
  const role = session?.user?.role;
  const dashboard = dashboardHref(role);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-on-background">
      <div
        className="pointer-events-none absolute -left-32 top-20 h-96 w-96 rounded-full bg-primary/10 blur-[120px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 bottom-32 h-80 w-80 rounded-full bg-secondary/10 blur-[100px]"
        aria-hidden
      />

      <header className="relative z-10 border-b border-outline-variant/60 bg-surface/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-container-max items-center justify-between px-lg">
          <Link href="/" className="flex items-center gap-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <MaterialIcon icon="school" filled className="text-[22px]" />
            </div>
            <span className="text-headline-md font-bold text-primary">
              EduCenter
            </span>
          </Link>
          <nav className="flex items-center gap-sm md:gap-md">
            {isAuthed ? (
              <Link
                href={dashboard}
                className="rounded-lg bg-primary px-md py-sm text-label-md font-semibold text-on-primary transition-colors hover:bg-primary-container hover:text-on-primary-container"
              >
                Open dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden rounded-lg px-md py-sm text-label-md font-semibold text-on-surface-variant transition-colors hover:text-on-surface sm:inline-block"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="rounded-lg bg-emerald-600 px-md py-sm text-label-md font-semibold text-white transition-colors hover:bg-emerald-500"
                >
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="relative z-10">
        <section className="mx-auto max-w-container-max px-lg pb-xl pt-xl md:pt-2xl">
          <div className="mx-auto max-w-3xl text-center">
            <span className="mb-md inline-flex items-center gap-xs rounded-full border border-primary/25 bg-primary/10 px-md py-1 text-label-sm font-semibold uppercase tracking-wider text-primary">
              <MaterialIcon icon="verified_user" className="text-[16px]" />
              Secure academic platform
            </span>
            <h1 className="text-headline-xl-mobile font-bold tracking-tight text-on-surface md:text-headline-xl">
              Learn without limits.
              <span className="mt-sm block text-primary">
                Teach with confidence.
              </span>
            </h1>
            <p className="mx-auto mt-lg max-w-2xl text-body-lg text-on-surface-variant">
              Education Center connects students to protected lecture media and
              gives institutions full control over content, access, and
              progress tracking.
            </p>

            <div className="mt-xl flex flex-col items-center justify-center gap-md sm:flex-row">
              {isAuthed ? (
                <Link
                  href={dashboard}
                  className="flex w-full max-w-xs items-center justify-center gap-sm rounded-xl bg-primary px-xl py-md text-label-md font-bold text-on-primary shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] sm:w-auto"
                >
                  <MaterialIcon icon="dashboard" />
                  Continue to dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/signup"
                    className="flex w-full max-w-xs items-center justify-center gap-sm rounded-xl bg-emerald-600 px-xl py-md text-label-md font-bold text-white shadow-lg shadow-emerald-600/25 transition-all hover:bg-emerald-500 hover:scale-[1.02] active:scale-[0.98] sm:w-auto"
                  >
                    <MaterialIcon icon="person_add" />
                    Create student account
                  </Link>
                  <Link
                    href="/login"
                    className="flex w-full max-w-xs items-center justify-center gap-sm rounded-xl border border-outline-variant bg-surface-container-high px-xl py-md text-label-md font-semibold text-on-surface transition-all hover:border-primary/50 hover:text-primary sm:w-auto"
                  >
                    <MaterialIcon icon="login" />
                    Sign in
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-container-max px-lg py-xl">
          <h2 className="mb-lg text-center text-headline-lg font-semibold text-on-surface">
            Everything in one place
          </h2>
          <div className="grid grid-cols-1 gap-lg sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="glass-card rounded-xl p-lg transition-colors hover:border-primary/40"
              >
                <div className="mb-md flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <MaterialIcon icon={f.icon} className="text-[26px]" />
                </div>
                <h3 className="text-headline-md font-semibold text-on-surface">
                  {f.title}
                </h3>
                <p className="mt-sm text-body-sm text-on-surface-variant">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-container-max px-lg pb-2xl">
          <div className="grid grid-cols-1 gap-lg md:grid-cols-2">
            <div className="rounded-xl border border-emerald-500/20 bg-surface-container-high p-xl">
              <div className="mb-md flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
                <MaterialIcon icon="school" filled className="text-[28px]" />
              </div>
              <h3 className="text-headline-md font-semibold text-on-surface">
                For students
              </h3>
              <p className="mt-sm text-body-sm text-on-surface-variant">
                Browse your curriculum, redeem lecture codes, and watch protected
                video, audio, and PDF materials.
              </p>
              <ul className="mt-md space-y-xs text-body-sm text-on-surface-variant">
                <li className="flex items-center gap-sm">
                  <MaterialIcon icon="check_circle" className="text-emerald-400" />
                  Content browser by year & term
                </li>
                <li className="flex items-center gap-sm">
                  <MaterialIcon icon="check_circle" className="text-emerald-400" />
                  12-character lecture codes
                </li>
                <li className="flex items-center gap-sm">
                  <MaterialIcon icon="check_circle" className="text-emerald-400" />
                  Resume playback & progress sync
                </li>
              </ul>
              <div className="mt-lg flex flex-wrap gap-sm">
                <Link
                  href={isAuthed && role === "STUDENT" ? "/student" : "/signup"}
                  className="rounded-lg bg-emerald-600 px-md py-sm text-label-md font-semibold text-white hover:bg-emerald-500"
                >
                  {isAuthed && role === "STUDENT"
                    ? "Browse content"
                    : "Get started"}
                </Link>
                <Link
                  href="/student/code"
                  className="rounded-lg border border-outline-variant px-md py-sm text-label-md text-on-surface-variant hover:border-emerald-500/40 hover:text-emerald-400"
                >
                  Enter code
                </Link>
              </div>
            </div>

            <div className="rounded-xl border border-primary/20 bg-surface-container-high p-xl">
              <div className="mb-md flex h-12 w-12 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <MaterialIcon
                  icon="admin_panel_settings"
                  filled
                  className="text-[28px]"
                />
              </div>
              <h3 className="text-headline-md font-semibold text-on-surface">
                For staff & administrators
              </h3>
              <p className="mt-sm text-body-sm text-on-surface-variant">
                Manage academic hierarchy, upload media to secure storage, assign
                subscriptions, and review usage analytics.
              </p>
              <ul className="mt-md space-y-xs text-body-sm text-on-surface-variant">
                <li className="flex items-center gap-sm">
                  <MaterialIcon icon="check_circle" className="text-primary" />
                  Dashboard & user management
                </li>
                <li className="flex items-center gap-sm">
                  <MaterialIcon icon="check_circle" className="text-primary" />
                  R2 media uploads & hierarchy
                </li>
                <li className="flex items-center gap-sm">
                  <MaterialIcon icon="check_circle" className="text-primary" />
                  Usage export & audit trail
                </li>
              </ul>
              <Link
                href={
                  isAuthed &&
                  (role === "ADMIN" ||
                    role === "MODERATOR" ||
                    role === "SUPER_ADMIN")
                    ? "/admin"
                    : "/login"
                }
                className="mt-lg inline-flex rounded-lg bg-primary px-md py-sm text-label-md font-semibold text-on-primary hover:bg-primary-container hover:text-on-primary-container"
              >
                {isAuthed &&
                (role === "ADMIN" ||
                  role === "MODERATOR" ||
                  role === "SUPER_ADMIN")
                  ? "Admin dashboard"
                  : "Staff sign in"}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-outline-variant bg-surface-container-lowest">
        <div className="mx-auto flex max-w-container-max flex-col items-center justify-between gap-md px-lg py-lg md:flex-row">
          <div className="flex items-center gap-sm text-on-surface-variant">
            <MaterialIcon icon="school" className="text-primary" />
            <span className="text-label-md font-semibold">EduCenter</span>
            <span className="text-body-sm opacity-70">
              © {new Date().getFullYear()} Education Center
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-lg text-label-sm">
            <Link
              href="/login"
              className="text-on-surface-variant transition-colors hover:text-primary"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="text-on-surface-variant transition-colors hover:text-emerald-400"
            >
              Sign up
            </Link>
            <Link
              href="/api/health"
              className="text-on-surface-variant transition-colors hover:text-primary"
            >
              API status
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
