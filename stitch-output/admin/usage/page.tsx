"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { MaterialIcon } from "../../components/MaterialIcon";
import { api } from "../../lib/api";
import { isRtlLocale } from "@/shared/i18n/rtl";

type UsageRow = {
  _id: string;
  watchedSeconds: number;
  completionPercent: number;
  isCompleted?: boolean;
  updatedAt: string;
  userId?: { _id?: string; name?: string; email?: string } | string;
  mediaId?: { fileName?: string; fileType?: string } | string;
  lectureId?: { _id?: string; title?: string } | string;
};

type IdItem = { _id: string; name?: string; title?: string };

type LectureMeta = {
  yearId: string;
  termId: string;
  sectionId: string;
};

type MediaFilter = "ALL" | "VIDEO" | "AUDIO";
type CompletionFilter = "ALL" | "COMPLETED" | "IN_PROGRESS";

const PAGE_SIZE = 25;

const selectClass =
  "w-full rounded-lg border border-outline-variant bg-surface-dim px-3 py-2 text-body-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary";

function resolveLectureId(row: UsageRow): string | null {
  const l = row.lectureId;
  if (l && typeof l === "object" && l._id) return String(l._id);
  if (typeof l === "string") return l;
  return null;
}

function idOf(item: { _id: unknown }): string {
  return String(item._id);
}

function resolveUser(
  row: UsageRow,
  unknownLabel: string,
): { name: string; email: string } {
  const u = row.userId;
  if (u && typeof u === "object") {
    return { name: u.name ?? unknownLabel, email: u.email ?? "" };
  }
  return { name: unknownLabel, email: "" };
}

function resolveMedia(row: UsageRow): { fileName: string; fileType: string } {
  const m = row.mediaId;
  if (m && typeof m === "object") {
    return {
      fileName: m.fileName ?? "—",
      fileType: m.fileType ?? "—",
    };
  }
  return { fileName: "—", fileType: "—" };
}

function resolveLectureTitle(row: UsageRow): string {
  const l = row.lectureId;
  if (l && typeof l === "object") return l.title ?? "—";
  return "—";
}

function formatRelativeTime(
  dateStr: string,
  t: (
    key:
      | "justNow"
      | "minsAgo"
      | "minsAgoPlural"
      | "hoursAgo"
      | "hoursAgoPlural"
      | "daysAgo"
      | "daysAgoPlural",
    values?: { count: number },
  ) => string,
): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return t("justNow");
  const mins = Math.floor(sec / 60);
  if (mins < 60) {
    return mins === 1
      ? t("minsAgo", { count: mins })
      : t("minsAgoPlural", { count: mins });
  }
  const hours = Math.floor(mins / 60);
  if (hours < 24) {
    return hours === 1
      ? t("hoursAgo", { count: hours })
      : t("hoursAgoPlural", { count: hours });
  }
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return days === 1
      ? t("daysAgo", { count: days })
      : t("daysAgoPlural", { count: days });
  }
  return new Date(dateStr).toLocaleDateString();
}

function formatWatchedDuration(
  totalSeconds: number,
  t: (key: "minutesUnit" | "secondsUnit") => string,
): string {
  const secs = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(secs / 60);
  const rem = secs % 60;

  if (mins === 0) {
    return `${rem} ${t("secondsUnit")}`;
  }
  if (rem === 0) {
    return `${mins} ${t("minutesUnit")}`;
  }
  return `${mins} ${t("minutesUnit")} ${rem} ${t("secondsUnit")}`;
}

function typeBadgeClass(type: string): string {
  switch (type.toUpperCase()) {
    case "VIDEO":
      return "bg-primary/20 text-primary border-primary/30";
    case "AUDIO":
      return "bg-secondary/20 text-secondary border-secondary/30";
    default:
      return "bg-surface-variant text-on-surface-variant border-outline-variant";
  }
}

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="border-b border-outline-variant/50">
          <td className="px-lg py-md">
            <div className="loading-shimmer h-10 w-32 rounded" />
          </td>
          <td className="px-lg py-md">
            <div className="loading-shimmer mb-2 h-4 w-48 rounded" />
            <div className="loading-shimmer h-3 w-32 rounded" />
          </td>
          <td className="px-lg py-md">
            <div className="loading-shimmer h-6 w-16 rounded-full" />
          </td>
          <td className="px-lg py-md text-end">
            <div className="loading-shimmer ms-auto h-4 w-12 rounded" />
          </td>
          <td className="px-lg py-md">
            <div className="loading-shimmer h-2 w-full rounded" />
          </td>
          <td className="px-lg py-md">
            <div className="loading-shimmer h-4 w-24 rounded" />
          </td>
        </tr>
      ))}
    </>
  );
}

export default function UsageAnalyticsPage() {
  const t = useTranslations("admin.usage");
  const locale = useLocale();
  const alignClass = isRtlLocale(locale) ? "text-right" : "text-left";

  const [rows, setRows] = useState<UsageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [search, setSearch] = useState("");
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>("ALL");
  const [completionFilter, setCompletionFilter] =
    useState<CompletionFilter>("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(0);

  const [years, setYears] = useState<IdItem[]>([]);
  const [terms, setTerms] = useState<IdItem[]>([]);
  const [sections, setSections] = useState<IdItem[]>([]);
  const [lectures, setLectures] = useState<IdItem[]>([]);
  const [lectureMetaMap, setLectureMetaMap] = useState<
    Record<string, LectureMeta>
  >({});

  const [academicYearId, setAcademicYearId] = useState("");
  const [termId, setTermId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [lectureId, setLectureId] = useState("");

  const [toast, setToast] = useState<{
    message: string;
    icon: string;
    error?: boolean;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [usageData, yearsData, lectureOptionsData] = await Promise.all([
        api<{ usage: UsageRow[] }>("/api/admin/usage"),
        api<{ academicYears: IdItem[] }>("/api/academic-years"),
        api<{
          lectures: Array<LectureMeta & { id: string }>;
        }>("/api/media/lecture-options"),
      ]);
      setRows(usageData.usage);
      setYears(yearsData.academicYears);
      const meta: Record<string, LectureMeta> = {};
      for (const item of lectureOptionsData.lectures) {
        meta[item.id] = {
          yearId: item.yearId,
          termId: item.termId,
          sectionId: item.sectionId,
        };
      }
      setLectureMetaMap(meta);
    } catch (e) {
      setToast({
        message: e instanceof Error ? e.message : t("loadFailed"),
        icon: "error",
        error: true,
      });
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    setPage(0);
  }, [
    search,
    mediaFilter,
    completionFilter,
    dateFrom,
    dateTo,
    academicYearId,
    termId,
    sectionId,
    lectureId,
  ]);

  useEffect(() => {
    if (!academicYearId) {
      setTerms([]);
      return;
    }
    api<{ terms: IdItem[] }>(`/api/terms?academicYearId=${academicYearId}`)
      .then((d) => setTerms(d.terms))
      .catch(() => setTerms([]));
  }, [academicYearId]);

  useEffect(() => {
    if (!termId) {
      setSections([]);
      return;
    }
    (async () => {
      try {
        const { subjects } = await api<{ subjects: IdItem[] }>(
          `/api/subjects?termId=${termId}`,
        );
        const sectionLists = await Promise.all(
          subjects.map((s) =>
            api<{ sections: IdItem[] }>(
              `/api/sections?subjectId=${idOf(s)}`,
            ).then((d) => d.sections),
          ),
        );
        const seen = new Set<string>();
        const merged: IdItem[] = [];
        for (const list of sectionLists) {
          for (const section of list) {
            const id = idOf(section);
            if (seen.has(id)) continue;
            seen.add(id);
            merged.push(section);
          }
        }
        merged.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
        setSections(merged);
      } catch {
        setSections([]);
      }
    })();
  }, [termId]);

  useEffect(() => {
    if (!sectionId) {
      setLectures([]);
      return;
    }
    api<{ lectures: IdItem[] }>(`/api/lectures?sectionId=${sectionId}`)
      .then((d) => setLectures(d.lectures))
      .catch(() => setLectures([]));
  }, [sectionId]);

  function resetHierarchy(from: "year" | "term" | "section") {
    if (from === "year") {
      setTermId("");
      setSectionId("");
      setLectureId("");
    } else if (from === "term") {
      setSectionId("");
      setLectureId("");
    } else {
      setLectureId("");
    }
  }

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows
      .filter((r) => {
        const user = resolveUser(r, t("unknown"));
        if (term) {
          const match =
            user.name.toLowerCase().includes(term) ||
            user.email.toLowerCase().includes(term);
          if (!match) return false;
        }

        const media = resolveMedia(r);
        if (mediaFilter !== "ALL" && media.fileType !== mediaFilter) {
          return false;
        }

        const pct = r.completionPercent ?? 0;
        if (completionFilter === "COMPLETED" && pct < 95) return false;
        if (completionFilter === "IN_PROGRESS" && pct >= 95) return false;

        if (dateFrom) {
          const from = new Date(dateFrom);
          from.setHours(0, 0, 0, 0);
          if (new Date(r.updatedAt) < from) return false;
        }
        if (dateTo) {
          const to = new Date(dateTo);
          to.setHours(23, 59, 59, 999);
          if (new Date(r.updatedAt) > to) return false;
        }

        const rowLectureId = resolveLectureId(r);
        if (lectureId) {
          if (rowLectureId !== lectureId) return false;
        } else if (academicYearId || termId || sectionId) {
          if (!rowLectureId) return false;
          const meta = lectureMetaMap[rowLectureId];
          if (!meta) return false;
          if (sectionId && meta.sectionId !== sectionId) return false;
          if (termId && meta.termId !== termId) return false;
          if (academicYearId && meta.yearId !== academicYearId) return false;
        }

        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
  }, [
    rows,
    search,
    mediaFilter,
    completionFilter,
    dateFrom,
    dateTo,
    academicYearId,
    termId,
    sectionId,
    lectureId,
    lectureMetaMap,
    t,
  ]);

  const summary = useMemo(() => {
    const totalSeconds = filtered.reduce(
      (sum, r) => sum + (r.watchedSeconds ?? 0),
      0,
    );
    const avgCompletion =
      filtered.length > 0
        ? filtered.reduce((sum, r) => sum + (r.completionPercent ?? 0), 0) /
          filtered.length
        : 0;
    const uniqueStudents = new Set(
      filtered.map((r) => {
        const u = r.userId;
        if (u && typeof u === "object" && u._id) return String(u._id);
        return resolveUser(r, t("unknown")).email;
      }),
    ).size;

    return {
      watchHours: totalSeconds / 3600,
      avgCompletion,
      uniqueStudents,
    };
  }, [filtered, t]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  async function exportCsv() {
    setExporting(true);
    try {
      const res = await fetch("/api/admin/usage/export", {
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          (err as { error?: string }).error ?? t("exportFailed"),
        );
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "usage-export.csv";
      a.click();
      URL.revokeObjectURL(url);
      setToast({ message: t("exportSuccess"), icon: "download" });
    } catch (e) {
      setToast({
        message: e instanceof Error ? e.message : t("exportFailed"),
        icon: "error",
        error: true,
      });
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="mx-auto max-w-container-max space-y-lg">
      <div className="flex flex-col justify-between gap-md sm:flex-row sm:items-center">
        <div>
          <h2 className="text-headline-lg font-semibold text-on-surface">
            {t("title")}
          </h2>
          <p className="text-body-sm text-on-surface-variant">
            {t("subtitle")}
          </p>
        </div>
        <button
          type="button"
          disabled={exporting || loading}
          className="flex items-center gap-sm rounded-lg bg-primary-container px-lg py-sm font-label-md text-on-primary-container transition-all hover:brightness-110 active:scale-95 disabled:opacity-60"
          onClick={exportCsv}
        >
          <MaterialIcon icon="download" className="text-[20px]" />
          {exporting ? t("exporting") : t("export")}
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-lg md:grid-cols-3">
        <div className="group flex items-center gap-lg rounded-xl border border-outline-variant bg-surface-container-low p-lg transition-colors hover:border-primary/50">
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <MaterialIcon icon="schedule" className="text-[32px]" />
          </div>
          <div>
            <p className="text-label-sm uppercase tracking-wider text-on-surface-variant">
              {t("totalWatchHours")}
            </p>
            <h3 className="text-headline-lg font-bold text-on-surface">
              {loading
                ? "…"
                : `${summary.watchHours.toLocaleString(undefined, { maximumFractionDigits: 1 })} hrs`}
            </h3>
            <p className="mt-1 flex items-center gap-xs text-label-sm text-on-surface-variant">
              {t("fromFiltered")}
            </p>
          </div>
        </div>

        <div className="group flex items-center gap-lg rounded-xl border border-outline-variant bg-surface-container-low p-lg transition-colors hover:border-primary/50">
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
            <MaterialIcon icon="check_circle" className="text-[32px]" />
          </div>
          <div>
            <p className="text-label-sm uppercase tracking-wider text-on-surface-variant">
              {t("avgCompletion")}
            </p>
            <h3 className="text-headline-lg font-bold text-on-surface">
              {loading
                ? "…"
                : `${summary.avgCompletion.toFixed(0)}%`}
            </h3>
          </div>
        </div>

        <div className="group flex items-center gap-lg rounded-xl border border-outline-variant bg-surface-container-low p-lg transition-colors hover:border-primary/50">
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-tertiary/10 text-tertiary">
            <MaterialIcon icon="person" className="text-[32px]" />
          </div>
          <div>
            <p className="text-label-sm uppercase tracking-wider text-on-surface-variant">
              {t("uniqueStudents")}
            </p>
            <h3 className="text-headline-lg font-bold text-on-surface">
              {loading ? "…" : summary.uniqueStudents.toLocaleString()}
            </h3>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-md rounded-xl border border-outline-variant bg-surface-container p-md">
        <div className="grid grid-cols-1 items-end gap-md md:grid-cols-4">
          <div className="space-y-sm">
            <label className="block text-label-sm text-on-surface-variant">
              {t("filterYear")}
            </label>
            <select
              className={selectClass}
              value={academicYearId}
              onChange={(e) => {
                setAcademicYearId(e.target.value);
                resetHierarchy("year");
              }}
            >
              <option value="">{t("allYears")}</option>
              {years.map((y) => (
                <option key={idOf(y)} value={idOf(y)}>
                  {y.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-sm">
            <label className="block text-label-sm text-on-surface-variant">
              {t("filterTerm")}
            </label>
            <select
              className={selectClass}
              value={termId}
              disabled={!academicYearId}
              onChange={(e) => {
                setTermId(e.target.value);
                resetHierarchy("term");
              }}
            >
              <option value="">{t("allTerms")}</option>
              {terms.map((term) => (
                <option key={idOf(term)} value={idOf(term)}>
                  {term.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-sm">
            <label className="block text-label-sm text-on-surface-variant">
              {t("filterSection")}
            </label>
            <select
              className={selectClass}
              value={sectionId}
              disabled={!termId}
              onChange={(e) => {
                setSectionId(e.target.value);
                resetHierarchy("section");
              }}
            >
              <option value="">{t("allSections")}</option>
              {sections.map((s) => (
                <option key={idOf(s)} value={idOf(s)}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-sm">
            <label className="block text-label-sm text-on-surface-variant">
              {t("filterLecture")}
            </label>
            <select
              className={selectClass}
              value={lectureId}
              disabled={!sectionId}
              onChange={(e) => setLectureId(e.target.value)}
            >
              <option value="">{t("allLectures")}</option>
              {lectures.map((l) => (
                <option key={idOf(l)} value={idOf(l)}>
                  {l.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 items-end gap-md md:grid-cols-4">
        <div className="space-y-sm">
          <label className="block text-label-sm text-on-surface-variant">
            {t("searchStudent")}
          </label>
          <div className="relative">
            <MaterialIcon
              icon="search"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="w-full rounded-lg border border-outline-variant bg-surface-dim py-2 pl-10 text-body-sm outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
        <div className="space-y-sm">
          <label className="block text-label-sm text-on-surface-variant">
            {t("mediaType")}
          </label>
          <select
            className={selectClass}
            value={mediaFilter}
            onChange={(e) => setMediaFilter(e.target.value as MediaFilter)}
          >
            <option value="ALL">{t("all")}</option>
            <option value="VIDEO">VIDEO</option>
            <option value="AUDIO">AUDIO</option>
          </select>
        </div>
        <div className="space-y-sm">
          <label className="block text-label-sm text-on-surface-variant">
            {t("completionStatus")}
          </label>
          <select
            className={selectClass}
            value={completionFilter}
            onChange={(e) =>
              setCompletionFilter(e.target.value as CompletionFilter)
            }
          >
            <option value="ALL">{t("all")}</option>
            <option value="COMPLETED">{t("completed95")}</option>
            <option value="IN_PROGRESS">{t("inProgress")}</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-sm">
          <div className="space-y-sm">
            <label className="block text-label-sm text-on-surface-variant">
              {t("dateFrom")}
            </label>
            <input
              type="date"
              className={selectClass}
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="space-y-sm">
            <label className="block text-label-sm text-on-surface-variant">
              {t("dateTo")}
            </label>
            <input
              type="date"
              className={selectClass}
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-low">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-start">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-container-high">
                <th className={`px-lg py-md text-label-md text-on-surface-variant ${alignClass}`}>
                  {t("colStudent")}
                </th>
                <th className={`px-lg py-md text-label-md text-on-surface-variant ${alignClass}`}>
                  {t("colContent")}
                </th>
                <th className={`px-lg py-md text-label-md text-on-surface-variant ${alignClass}`}>
                  {t("colType")}
                </th>
                <th className={`px-lg py-md ${alignClass} text-label-md text-on-surface-variant`}>
                  {t("colWatched")}
                </th>
                <th className={`min-w-[160px] px-lg py-md text-label-md text-on-surface-variant ${alignClass}`}>
                  {t("colProgress")}
                </th>
                <th className={`px-lg py-md text-label-md text-on-surface-variant ${alignClass}`}>
                  {t("colLastActive")}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton />
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-0">
                    <div className="flex flex-col items-center justify-center py-xl text-center">
                      <div className="mb-md flex h-20 w-20 items-center justify-center rounded-full bg-surface-container">
                        <MaterialIcon
                          icon="analytics"
                          className="text-[40px] text-outline"
                        />
                      </div>
                      <h4 className="text-headline-md font-bold text-on-surface">
                        {t("title")}
                      </h4>
                      <p className="mx-auto mt-sm max-w-xs text-body-sm text-on-surface-variant">
                        {rows.length === 0
                          ? t("emptyWatching")
                          : t("emptyFilters")}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paged.map((r) => {
                  const user = resolveUser(r, t("unknown"));
                  const media = resolveMedia(r);
                  const pct = Math.min(
                    100,
                    Math.max(0, r.completionPercent ?? 0),
                  );
                  const watchedSeconds = r.watchedSeconds ?? 0;
                  const watchedLabel = formatWatchedDuration(watchedSeconds, t);

                  return (
                    <tr
                      key={r._id}
                      className="border-b border-outline-variant/50 transition-colors hover:bg-surface-container"
                    >
                      <td className="px-lg py-md">
                        <p className="font-medium text-on-surface">
                          {user.name}
                        </p>
                        <p className="text-body-sm text-on-surface-variant">
                          {user.email}
                        </p>
                      </td>
                      <td className="px-lg py-md">
                        <p className="text-body-sm font-medium text-on-surface">
                          {resolveLectureTitle(r)}
                        </p>
                        <p className="text-label-sm text-on-surface-variant">
                          {media.fileName}
                        </p>
                      </td>
                      <td className="px-lg py-md">
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${typeBadgeClass(media.fileType)}`}
                        >
                          {media.fileType}
                        </span>
                      </td>
                      <td className={`px-lg py-md text-body-sm text-on-surface ${alignClass}`}>
                        {watchedLabel}
                      </td>
                      <td className="px-lg py-md">
                        <div className="space-y-xs">
                          <div className="flex items-center gap-sm">
                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-container">
                              <div
                                className="h-full bg-primary transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span
                              className={`w-10 shrink-0 text-label-sm text-on-surface-variant ${alignClass}`}
                            >
                              {pct.toFixed(0)}%
                            </span>
                          </div>
                          <p
                            className={`text-label-sm text-on-surface-variant ${alignClass}`}
                          >
                            {watchedLabel}
                          </p>
                        </div>
                      </td>
                      <td className="px-lg py-md text-body-sm text-on-surface-variant">
                        {formatRelativeTime(r.updatedAt, t)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between border-t border-outline-variant bg-surface-container px-lg py-md">
            <p className="text-label-sm text-on-surface-variant">
              <span className="font-bold text-on-surface">{paged.length}</span> /{" "}
              <span className="font-bold text-on-surface">{filtered.length}</span>
            </p>
            <div className="flex items-center gap-sm">
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-outline-variant text-on-surface-variant transition-colors hover:bg-surface-container-high disabled:opacity-50"
                disabled={page <= 0}
                onClick={() => setPage((p) => p - 1)}
                aria-label={t("previousPage")}
              >
                <MaterialIcon icon="chevron_left" />
              </button>
              <span className="min-w-[2rem] text-center font-bold text-label-md text-primary">
                {page + 1}
              </span>
              <span className="text-label-sm text-on-surface-variant">
                / {pageCount}
              </span>
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-outline-variant text-on-surface-variant transition-colors hover:bg-surface-container-high disabled:opacity-50"
                disabled={page >= pageCount - 1}
                onClick={() => setPage((p) => p + 1)}
                aria-label={t("nextPage")}
              >
                <MaterialIcon icon="chevron_right" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Toast */}
      <div
        className={`pointer-events-none fixed bottom-lg right-lg z-[110] transition-all duration-300 ${
          toast ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"
        }`}
        role="status"
        aria-live="polite"
      >
        {toast && (
          <div
            className={`flex items-center gap-md rounded-xl border px-lg py-md shadow-lg ${
              toast.error
                ? "border-error/30 bg-error-container text-on-error-container"
                : "border-outline bg-secondary-container text-on-secondary-container"
            }`}
          >
            <MaterialIcon icon={toast.icon} />
            <p className="text-label-md">{toast.message}</p>
          </div>
        )}
      </div>
    </div>
  );
}
