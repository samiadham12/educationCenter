"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useId, useRef, useState } from "react";
import { MaterialIcon } from "../../components/MaterialIcon";
import { api } from "../../lib/api";

type RedeemResponse = {
  success: boolean;
  lectureId: string;
  message?: string;
};

const CODE_LENGTH = 12;

function sanitizeCode(value: string): string {
  return value.replace(/[^A-Z0-9]/gi, "").toUpperCase().slice(0, CODE_LENGTH);
}

function formatErrorMessage(message: string): string {
  if (message.includes("Too many")) {
    return "Try again later. Too many attempts.";
  }
  if (message === "Invalid code") {
    return "Invalid code. Please check and try again.";
  }
  if (message === "Code expired" || message.includes("usage limit")) {
    return "This code has expired or reached its usage limit.";
  }
  return message;
}

export default function LectureCodeEntryPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const errorId = useId();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    const normalized = sanitizeCode(code);
    setCode(normalized);

    if (normalized.length !== CODE_LENGTH) {
      setError("Please enter the full 12-character code.");
      inputRef.current?.focus();
      return;
    }

    setLoading(true);
    try {
      const res = await api<RedeemResponse>("/api/lecture-codes/redeem", {
        method: "POST",
        body: JSON.stringify({ code: normalized }),
      });
      const lectureId = String(res.lectureId);
      router.push(`/student/watch/${lectureId}`);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to redeem code";
      setError(formatErrorMessage(msg));
      inputRef.current?.focus();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center py-md">
      <div className="w-full max-w-md">
        <Link
          href="/student"
          className="group mb-md flex items-center gap-xs text-emerald-400 transition-colors hover:text-emerald-300"
        >
          <MaterialIcon
            icon="arrow_back"
            className="text-[20px] transition-transform group-hover:-translate-x-1"
          />
          <span className="text-label-md">Back to content</span>
        </Link>

        <div className="relative overflow-hidden rounded-xl border border-slate-700 bg-slate-800/80 p-xl shadow-2xl">
          <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-emerald-500 to-transparent opacity-60" />

          <div className="mb-xl text-center">
            <div className="mb-md inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
              <MaterialIcon icon="key" className="text-[28px]" />
            </div>
            <h1 className="mb-sm text-headline-md font-semibold text-slate-100">
              Enter Lecture Code
            </h1>
            <p className="px-4 text-body-sm text-slate-400">
              Enter the 12-character code provided by your instructor to unlock
              your lecture.
            </p>
          </div>

          <form className="space-y-lg" onSubmit={onSubmit}>
            <div className="space-y-md">
              <label htmlFor="lecture-code" className="sr-only">
                Lecture access code
              </label>
              <input
                ref={inputRef}
                id="lecture-code"
                type="text"
                inputMode="text"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                maxLength={CODE_LENGTH}
                value={code}
                onChange={(e) => {
                  setCode(sanitizeCode(e.target.value));
                  if (error) setError("");
                }}
                placeholder="XXXXXXXXXXXX"
                aria-invalid={!!error}
                aria-describedby={error ? errorId : undefined}
                className="w-full rounded-lg border border-slate-600 bg-slate-950 py-md text-center font-mono text-2xl uppercase tracking-[0.2em] text-emerald-400 placeholder:text-slate-600 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40"
              />

              {error && (
                <div
                  id={errorId}
                  role="alert"
                  className="flex items-start gap-sm rounded-lg border border-red-500/30 bg-red-950/40 p-md"
                >
                  <MaterialIcon icon="error" className="shrink-0 text-[20px] text-red-400" />
                  <p className="text-body-sm text-red-300">{error}</p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-md rounded-lg bg-emerald-600 py-md text-label-md font-semibold text-white transition-all hover:bg-emerald-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span
                    className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"
                    aria-hidden
                  />
                  Unlocking…
                </>
              ) : (
                "Unlock Lecture"
              )}
            </button>
          </form>

          <p className="mt-xl border-t border-slate-700 pt-lg text-center text-body-sm text-slate-500">
            Enter the code exactly as shown by your instructor (letters and
            numbers only).
          </p>
        </div>
      </div>
    </div>
  );
}
