"use client";

import { getSession, signIn, useSession } from "next-auth/react";
import { FormEvent, useEffect, useId, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { MaterialIcon } from "../../components/MaterialIcon";
import { SignInBrandingPanel } from "../../components/auth/SignInBrandingPanel";

const inputClass =
  "h-11 w-full rounded border border-outline-variant bg-surface-container-lowest px-md font-body-md text-body-md text-on-surface outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20";

function homeForRole(role: string | undefined): "/student" | "/admin" {
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

export default function LoginPage() {
  const router = useRouter();
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const { data: session, status } = useSession();
  const errorId = useId();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role) {
      router.replace(homeForRole(session.user.role));
    }
  }, [status, session, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError(t("invalidCredentials"));
      return;
    }

    const nextSession = await getSession();
    router.refresh();
    router.push(homeForRole(nextSession?.user?.role));
  }

  return (
    <main className="flex min-h-screen flex-col overflow-hidden bg-background font-body-md text-on-surface selection:bg-primary selection:text-on-primary md:flex-row">
      <section className="z-10 flex flex-1 items-center justify-center bg-surface p-lg md:p-xl">
        <div className="w-full max-w-[400px]">
          <div className="mb-lg flex items-center justify-between md:hidden">
            <h1 className="font-headline-lg text-headline-lg font-bold text-primary">
              {tCommon("appName")}
            </h1>
            <LanguageSwitcher />
          </div>

          <div className="mb-xl">
            <h2 className="mb-sm font-headline-xl text-headline-xl text-on-surface">
              {t("welcomeBack")}
            </h2>
            <p className="font-body-md text-on-surface-variant">
              {t("signInSubtitle")}
            </p>
          </div>

          <form className="space-y-lg" onSubmit={onSubmit}>
            <div className="space-y-xs">
              <label
                htmlFor="email"
                className="block font-label-md text-label-md text-on-surface-variant"
              >
                {t("email")}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError("");
                }}
                className={inputClass}
                placeholder="student@university.edu"
              />
            </div>

            <div className="space-y-xs">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block font-label-md text-label-md text-on-surface-variant"
                >
                  {t("password")}
                </label>
                <span className="cursor-default font-label-sm text-label-sm text-primary">
                  {t("forgotPassword")}
                </span>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError("");
                  }}
                  className={`${inputClass} pr-10`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant transition-colors hover:text-primary"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={
                    showPassword ? t("hidePassword") : t("showPassword")
                  }
                >
                  <MaterialIcon
                    icon={showPassword ? "visibility_off" : "visibility"}
                    className="text-[20px]"
                  />
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-sm pt-xs">
              <input
                id="remember"
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-outline-variant bg-surface text-primary focus:ring-primary focus:ring-offset-background"
              />
              <label
                htmlFor="remember"
                className="font-label-sm text-label-sm text-on-surface-variant"
              >
                {t("rememberMe")}
              </label>
            </div>

            {error && (
              <p
                id={errorId}
                role="alert"
                className="font-body-sm text-body-sm text-error"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center space-x-sm rounded bg-primary font-label-md text-label-md text-on-primary transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span
                    className="h-5 w-5 animate-spin rounded-full border-2 border-on-primary/30 border-t-on-primary"
                    aria-hidden
                  />
                  <span>{t("signingIn")}</span>
                </>
              ) : (
                <>
                  <span>{t("signIn")}</span>
                  <MaterialIcon icon="login" className="text-[18px]" />
                </>
              )}
            </button>
          </form>

          <div className="mt-xl text-center">
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {t("noAccount")}{" "}
              <Link
                href="/signup"
                className="ms-xs font-semibold text-primary decoration-2 underline-offset-4 hover:underline"
              >
                {t("createAccount")}
              </Link>
            </p>
          </div>

          <div className="mt-xl flex justify-between border-t border-outline-variant/30 pt-lg">
            <span className="font-label-sm text-label-sm text-on-surface-variant/60">
              System Status: Optimal
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant/60">
              v2.4.0
            </span>
          </div>
        </div>
      </section>

      <SignInBrandingPanel />
    </main>
  );
}
