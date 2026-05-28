"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/stitch-output/lib/api";
import { MaterialIcon } from "@/stitch-output/components/MaterialIcon";

type RedeemRes = { success: boolean; lectureId: string };

export default function OneTimeLectureLinkPage() {
  const router = useRouter();
  const { token } = useParams<{ token: string }>();
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!token) return;
      try {
        const res = await api<RedeemRes>("/api/one-time-lecture-links/redeem", {
          method: "POST",
          body: JSON.stringify({ token: String(token) }),
        });
        if (cancelled) return;
        router.replace(`/student/watch/${encodeURIComponent(res.lectureId)}`);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to open lecture");
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [token, router]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center py-lg text-center">
      {error ? (
        <div className="max-w-md rounded-xl border border-error/30 bg-error-container p-lg text-on-error-container">
          <div className="mb-md flex items-center justify-center gap-sm">
            <MaterialIcon icon="error" />
            <p className="text-label-md font-semibold">Could not open lecture</p>
          </div>
          <p className="text-body-sm opacity-90">{error}</p>
        </div>
      ) : (
        <div className="max-w-md rounded-xl border border-outline-variant bg-surface-container p-lg">
          <div className="mb-md flex items-center justify-center gap-sm text-primary">
            <span
              className="h-5 w-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary"
              aria-hidden
            />
            <p className="text-label-md font-semibold">Opening lecture…</p>
          </div>
          <p className="text-body-sm text-on-surface-variant">
            Please wait a moment.
          </p>
        </div>
      )}
    </div>
  );
}

