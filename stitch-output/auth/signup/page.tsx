"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { FormEvent, useEffect, useId, useState } from "react";
import { MaterialIcon } from "../../components/MaterialIcon";
import { SignupBrandingPanel } from "../../components/auth/SignupBrandingPanel";
import { api } from "../../lib/api";

const inputClass =
  "w-full rounded border border-outline-variant bg-surface-container-lowest px-md py-sm font-body-md text-body-md text-on-surface outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary";

type AcademicYearOption = {
  _id: string;
  name: string;
  order: number;
};

type SignupResponse = {
  success: boolean;
  user?: { role?: string };
  message?: string;
};

export default function SignupPage() {
  const router = useRouter();
  const { status } = useSession();
  const errorId = useId();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [academicYearId, setAcademicYearId] = useState("");
  const [years, setYears] = useState<AcademicYearOption[]>([]);
  const [yearsLoading, setYearsLoading] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/student");
    }
  }, [status, router]);

  useEffect(() => {
    api<{ years: AcademicYearOption[] }>("/api/auth/signup-years")
      .then((data) => {
        setYears(data.years);
        if (data.years[0]) setAcademicYearId(data.years[0]._id);
      })
      .catch(() => setYears([]))
      .finally(() => setYearsLoading(false));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName) {
      setError("Please enter your full name.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const payload: {
        name: string;
        email: string;
        password: string;
        currentAcademicYearId?: string;
      } = {
        name: trimmedName,
        email: trimmedEmail,
        password,
      };
      if (academicYearId) payload.currentAcademicYearId = academicYearId;

      const res = await api<SignupResponse>("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (res.message && !res.user) {
        const signInRes = await signIn("credentials", {
          email: trimmedEmail,
          password,
          redirect: false,
        });
        if (signInRes?.error) {
          setError("Account created. Please sign in.");
          router.push("/login");
          return;
        }
      }

      router.push("/student");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen w-full bg-background text-on-background">
      <section className="relative z-10 flex w-full items-center justify-center bg-surface p-lg md:w-1/2">
        <div className="w-full max-w-md space-y-xl">
          <div className="mb-lg flex items-center gap-sm md:hidden">
            <MaterialIcon
              icon="school"
              filled
              className="text-3xl text-primary"
            />
            <span className="font-headline-lg text-headline-lg font-bold text-primary">
              EduPortal
            </span>
          </div>

          <div className="space-y-sm">
            <h1 className="font-headline-xl text-headline-xl text-on-surface md:text-headline-xl">
              Join the Academic Hub
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Create your professional account to access advanced learning
              resources.
            </p>
          </div>

          <form className="space-y-md" onSubmit={onSubmit}>
            <div className="space-y-xs">
              <label
                htmlFor="full_name"
                className="font-label-md text-label-md text-on-surface-variant"
              >
                Full Name
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                required
                maxLength={100}
                autoComplete="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError("");
                }}
                className={inputClass}
                placeholder="Dr. Jane Smith"
              />
            </div>

            <div className="space-y-xs">
              <label
                htmlFor="email"
                className="font-label-md text-label-md text-on-surface-variant"
              >
                Email Address
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
                placeholder="jane.smith@university.edu"
              />
            </div>

            {years.length > 0 && (
              <div className="space-y-xs">
                <label
                  htmlFor="academic_year"
                  className="font-label-md text-label-md text-on-surface-variant"
                >
                  Academic Year
                </label>
                <select
                  id="academic_year"
                  name="academic_year"
                  required
                  disabled={yearsLoading}
                  value={academicYearId}
                  onChange={(e) => setAcademicYearId(e.target.value)}
                  className={inputClass}
                >
                  {years.map((y) => (
                    <option key={y._id} value={y._id}>
                      {y.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 gap-md md:grid-cols-2">
              <div className="space-y-xs">
                <label
                  htmlFor="password"
                  className="font-label-md text-label-md text-on-surface-variant"
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError("");
                  }}
                  className={inputClass}
                />
              </div>
              <div className="space-y-xs">
                <label
                  htmlFor="confirm_password"
                  className="font-label-md text-label-md text-on-surface-variant"
                >
                  Confirm Password
                </label>
                <input
                  id="confirm_password"
                  name="confirm_password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (error) setError("");
                  }}
                  className={inputClass}
                />
              </div>
            </div>

            {error && (
              <div
                id={errorId}
                role="alert"
                className="flex items-start gap-sm rounded border border-error/30 bg-error-container/20 p-md"
              >
                <MaterialIcon
                  icon="error"
                  className="shrink-0 text-[20px] text-error"
                />
                <p className="font-body-sm text-body-sm text-error">{error}</p>
              </div>
            )}

            <div className="pt-sm">
              <button
                type="submit"
                disabled={loading || yearsLoading}
                className="flex w-full items-center justify-center gap-sm rounded bg-primary py-md font-label-md text-label-md font-bold text-on-primary transition-all duration-200 hover:bg-primary-container active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <MaterialIcon
                      icon="refresh"
                      className="animate-spin text-[20px]"
                    />
                    Processing...
                  </>
                ) : (
                  <>
                    Create Account
                    <MaterialIcon icon="arrow_forward" className="text-[20px]" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="flex flex-col items-center gap-md border-t border-outline-variant pt-lg">
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-bold text-primary hover:underline"
              >
                Sign in
              </Link>
            </p>
            <div className="flex gap-md">
              <button
                type="button"
                className="rounded border border-outline-variant bg-surface-container p-sm text-on-surface-variant transition-colors hover:border-primary"
                aria-label="Security"
              >
                <MaterialIcon icon="shield" />
              </button>
              <button
                type="button"
                className="rounded border border-outline-variant bg-surface-container p-sm text-on-surface-variant transition-colors hover:border-primary"
                aria-label="Help"
              >
                <MaterialIcon icon="help" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <SignupBrandingPanel />
    </main>
  );
}
