"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { MaterialIcon } from "../components/MaterialIcon";
import { api } from "../lib/api";

type ActivityRow = {
  _id?: string;
  action: string;
  endpoint: string;
  method: string;
  timestamp: string;
};

type AdminStats = {
  students: number;
  activeSubscriptions: number;
  mediaReady: number;
  recentActivity: ActivityRow[];
};

type PromotionResult = {
  promoted: number;
  skipped: number;
};

function methodBadgeClass(method: string): string {
  switch (method.toUpperCase()) {
    case "GET":
      return "bg-outline-variant/30 text-on-surface-variant";
    case "POST":
      return "bg-secondary-container/40 text-secondary";
    case "DELETE":
      return "bg-error-container/40 text-error";
    case "PUT":
    case "PATCH":
      return "bg-primary-container/30 text-primary";
    default:
      return "bg-outline-variant text-on-surface-variant";
  }
}

function countRecentPosts(activity: ActivityRow[]): number {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const inWeek = activity.filter(
    (a) => new Date(a.timestamp).getTime() >= weekAgo,
  );
  const posts = inWeek.filter((a) => a.method.toUpperCase() === "POST");
  return posts.length > 0 ? posts.length : activity.filter((a) => a.method === "POST").length;
}

function StatCardSkeleton() {
  return (
    <div className="flex flex-col gap-sm rounded-xl border border-outline-variant bg-surface-container p-lg shadow-sm">
      <div className="loading-shimmer h-4 w-32 rounded" />
      <div className="loading-shimmer h-10 w-24 rounded" />
      <div className="loading-shimmer h-1 w-full rounded" />
    </div>
  );
}

function TableRowSkeleton() {
  return (
    <tr className="border-b border-outline-variant/30">
      <td className="px-lg py-md">
        <div className="loading-shimmer h-4 w-48 rounded" />
      </td>
      <td className="px-lg py-md">
        <div className="loading-shimmer h-6 w-16 rounded" />
      </td>
      <td className="px-lg py-md text-right">
        <div className="loading-shimmer ml-auto h-4 w-24 rounded" />
      </td>
    </tr>
  );
}

export default function AdminDashboardPage() {
  const t = useTranslations("admin.dashboard");
  const tc = useTranslations("common");
  const { data: session } = useSession();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [toast, setToast] = useState<{ message: string; icon: string } | null>(
    null,
  );

  const role = session?.user?.role;
  const canPromote = role === "SUPER_ADMIN" || role === "ADMIN";

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api<AdminStats>("/api/admin/stats");
      setStats(data);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : t("statsError"),
      );
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  const executePromotion = async () => {
    setPromoting(true);
    try {
      const res = await api<PromotionResult>("/api/academic-years/promote-all", {
        method: "POST",
        body: "{}",
      });
      setModalOpen(false);
      setToast({
        message: t("promotionComplete", {
          promoted: res.promoted,
          skipped: res.skipped,
        }),
        icon: "check_circle",
      });
      await loadStats();
    } catch (e) {
      setToast({
        message: e instanceof Error ? e.message : t("operationFailed"),
        icon: "error",
      });
    } finally {
      setPromoting(false);
    }
  };

  const uploadsCount = stats ? countRecentPosts(stats.recentActivity) : 0;
  const activityRows = (stats?.recentActivity ?? []).slice(0, 10);

  return (
    <div className="space-y-xl">
      {/* Error banner */}
      {error && (
        <div className="flex items-center justify-between rounded-lg border border-on-error/20 bg-error-container p-md text-on-error-container">
          <div className="flex items-center gap-md">
            <MaterialIcon icon="error" />
            <p className="text-body-md">{error}</p>
          </div>
          <button
            type="button"
            className="rounded px-md py-xs font-label-md text-error-container transition-all hover:opacity-90 bg-on-error-container"
            onClick={loadStats}
          >
            {t("retry")}
          </button>
        </div>
      )}

      {/* Stat cards */}
      <section className="grid grid-cols-1 gap-lg sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          stats && (
            <>
              <div className="group relative flex flex-col gap-sm overflow-hidden rounded-xl border border-outline-variant bg-surface-container p-lg shadow-sm">
                <div className="flex items-start justify-between">
                  <span className="text-label-md uppercase tracking-wider text-on-surface-variant">
                    {t("totalStudents")}
                  </span>
                  <MaterialIcon icon="person" filled className="text-primary" />
                </div>
                <div className="text-headline-xl font-bold text-on-surface">
                  {stats.students.toLocaleString()}
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-outline-variant/30">
                  <div className="h-full w-3/4 bg-primary" />
                </div>
              </div>

              <div className="flex flex-col gap-sm rounded-xl border border-outline-variant bg-surface-container p-lg shadow-sm">
                <div className="flex items-start justify-between">
                  <span className="text-label-md uppercase tracking-wider text-on-surface-variant">
                    {t("activeSubscriptions")}
                  </span>
                  <MaterialIcon icon="payments" className="text-tertiary" />
                </div>
                <div className="text-headline-xl font-bold text-on-surface">
                  {stats.activeSubscriptions.toLocaleString()}
                </div>
                <div className="flex items-center gap-xs text-body-sm text-tertiary">
                  <MaterialIcon icon="trending_up" className="text-sm" />
                  {t("activeEnrollmentPlans")}
                </div>
              </div>

              <div className="flex flex-col gap-sm rounded-xl border border-outline-variant bg-surface-container p-lg shadow-sm">
                <div className="flex items-start justify-between">
                  <span className="text-label-md uppercase tracking-wider text-on-surface-variant">
                    {t("mediaReady")}
                  </span>
                  <MaterialIcon icon="movie" className="text-primary-fixed" />
                </div>
                <div className="text-headline-xl font-bold text-on-surface">
                  {stats.mediaReady.toLocaleString()}
                </div>
                <p className="text-body-sm text-on-surface-variant">
                  {t("validatedAssets")}
                </p>
              </div>

              <div className="flex flex-col gap-sm rounded-xl border border-outline-variant bg-gradient-to-br from-surface-container to-surface-container-high p-lg shadow-sm">
                <div className="flex items-start justify-between">
                  <span className="text-label-md uppercase tracking-wider text-on-surface-variant">
                    {t("uploadsThisWeek")}
                  </span>
                  <MaterialIcon icon="cloud_upload" className="text-secondary" />
                </div>
                <div className="text-headline-xl font-bold text-on-surface">
                  {uploadsCount.toLocaleString()}
                </div>
                <p className="text-body-sm italic text-on-surface-variant">
                  {t("totalItemsIndexed", {
                    count: stats.mediaReady.toLocaleString(),
                  })}
                </p>
              </div>
            </>
          )
        )}
      </section>

      {/* Recent activity */}
      <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container">
        <div className="flex items-center justify-between border-b border-outline-variant px-lg py-md">
          <h3 className="text-headline-md font-semibold text-on-surface">
            {t("recentActivity")}
          </h3>
          <span className="rounded bg-surface-variant px-md py-xs text-label-sm text-on-surface-variant">
            {t("last10Logs")}
          </span>
        </div>
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-surface-container-high/50">
                <th className="px-lg py-md text-label-md uppercase tracking-widest text-on-surface-variant">
                  {t("colAction")}
                </th>
                <th className="px-lg py-md text-label-md uppercase tracking-widest text-on-surface-variant">
                  {t("colMethod")}
                </th>
                <th className="px-lg py-md text-end text-label-md uppercase tracking-widest text-on-surface-variant">
                  {t("colTime")}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <>
                  <TableRowSkeleton />
                  <TableRowSkeleton />
                  <TableRowSkeleton />
                </>
              ) : activityRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-lg py-xl text-center text-body-sm text-on-surface-variant"
                  >
                    {t("noRecentActivity")}
                  </td>
                </tr>
              ) : (
                activityRows.map((log) => (
                  <tr
                    key={log._id ?? `${log.timestamp}-${log.action}`}
                    className="border-b border-outline-variant/30 transition-colors hover:bg-surface-container-high"
                  >
                    <td className="px-lg py-md text-body-sm text-on-surface">
                      {log.action}
                    </td>
                    <td className="px-lg py-md">
                      <span
                        className={`rounded px-sm py-xs font-mono text-[10px] font-bold ${methodBadgeClass(log.method)}`}
                      >
                        {log.method}
                      </span>
                    </td>
                    <td className="px-lg py-md text-center text-body-sm text-on-surface-variant opacity-60">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Actions row */}
      <section className="grid gap-lg lg:grid-cols-3">
        {canPromote && (
          <div className="flex items-center justify-between gap-lg rounded-xl border border-outline-variant bg-surface-container p-lg lg:col-span-2">
            <div className="flex-1">
              <h4 className="flex items-center gap-sm text-headline-md font-semibold text-on-surface">
                {t("annualPromotion")}
                <MaterialIcon icon="warning" className="text-tertiary" />
              </h4>
              <p className="mt-xs text-body-sm text-on-surface-variant">
                {t("promotionDesc")}{" "}
                <span className="font-bold text-error">{t("warning")}</span>{" "}
                {t("promotionPermanent")}
              </p>
            </div>
            <button
              type="button"
              className="flex h-12 shrink-0 items-center gap-md rounded border-2 border-error px-lg font-label-md text-error transition-all hover:bg-error hover:text-on-error"
              onClick={() => setModalOpen(true)}
              disabled={loading}
            >
              {t("executePromotion")}
            </button>
          </div>
        )}

        <div className="rounded-xl border border-outline-variant bg-surface-container p-lg">
          <h4 className="mb-md text-label-md uppercase text-on-surface-variant">
            {t("systemHealth")}
          </h4>
          <div className="space-y-md">
            <div className="flex items-center justify-between">
              <span className="text-body-sm text-on-surface">{t("apiStatus")}</span>
              <span className="rounded-full bg-primary/20 px-sm py-1 text-[10px] font-bold text-primary">
                {error ? t("degraded") : t("operational")}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-body-sm text-on-surface">{t("dataSync")}</span>
              <span className="font-mono text-body-sm text-on-surface-variant">
                {loading ? "…" : t("live")}
              </span>
            </div>
            <div className="h-1 w-full rounded bg-outline-variant/30">
              <div
                className={`h-full bg-primary ${error ? "w-1/2" : "w-[98%]"}`}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Confirm modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 p-lg backdrop-blur-sm">
          <div
            className="w-full max-w-md rounded-xl border border-outline-variant bg-surface-container p-lg shadow-xl"
            role="dialog"
            aria-labelledby="promotion-dialog-title"
            aria-modal="true"
          >
            <h5
              id="promotion-dialog-title"
              className="text-headline-md font-semibold text-on-surface"
            >
              {t("confirmPromotionTitle")}
            </h5>
            <p className="mt-md text-body-md text-on-surface-variant">
              {t("confirmPromotionBody")}
            </p>
            <div className="mt-xl flex gap-md">
              <button
                type="button"
                className="flex-1 rounded bg-surface-variant py-md font-label-md text-on-surface transition-colors hover:bg-surface-container-highest"
                onClick={() => setModalOpen(false)}
                disabled={promoting}
              >
                {tc("cancel")}
              </button>
              <button
                type="button"
                className="flex flex-1 items-center justify-center gap-sm rounded bg-error py-md font-label-md text-on-error transition-all hover:opacity-90 disabled:opacity-60"
                onClick={executePromotion}
                disabled={promoting}
              >
                {promoting ? (
                  <>
                    <MaterialIcon icon="sync" className="animate-spin" />
                    {t("running")}
                  </>
                ) : (
                  t("proceed")
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      <div
        className={`pointer-events-none fixed bottom-lg right-lg z-[110] transition-all duration-300 ${
          toast ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"
        }`}
        role="status"
        aria-live="polite"
      >
        {toast && (
          <div className="flex items-center gap-md rounded-xl border border-outline bg-secondary-container px-lg py-md text-on-secondary-container shadow-lg">
            <MaterialIcon icon={toast.icon} />
            <p className="text-label-md">{toast.message}</p>
          </div>
        )}
      </div>
    </div>
  );
}
