"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { MaterialIcon } from "../../components/MaterialIcon";
import { api } from "../../lib/api";

type AcademicYear = {
  _id: string;
  name: string;
  order: number;
  isActive: boolean;
};

type StudentUser = {
  _id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  currentAcademicYearId?: string;
  currentYearOrder?: number;
  createdAt?: string;
};

type BulkStudentRow = {
  email: string;
  password: string;
  name: string;
  currentAcademicYearId: string;
  currentYearOrder: number;
};

type BulkResult = {
  created: Array<{ id: string; email: string }>;
  errors: Array<{ email: string; error: string }>;
};

const inputClass =
  "w-full rounded border border-outline-variant bg-background p-sm text-body-sm text-on-surface outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary";

const CSV_HEADERS = [
  "email",
  "password",
  "name",
  "currentAcademicYearId",
  "currentYearOrder",
] as const;

const PAGE_SIZE = 10;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function yearOrderLabel(
  order: number | undefined,
  t: (key: "year1" | "year2" | "year3" | "year4") => string,
): string {
  if (!order || order < 1 || order > 4) return "—";
  const keys = ["year1", "year2", "year3", "year4"] as const;
  return t(keys[order - 1]!);
}

function randomPassword(length = 12): string {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
  let out = "";
  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  for (let i = 0; i < length; i++) {
    out += chars[arr[i]! % chars.length];
  }
  return out;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += c;
    }
  }
  result.push(current.trim());
  return result;
}

function parseStudentsCsv(
  text: string,
  validYearIds: Set<string>,
  t: (key: string) => string,
): { rows: BulkStudentRow[]; errors: string[] } {
  const lines = text
    .trim()
    .split(/\r?\n/)
    .filter((l) => l.trim());
  const errors: string[] = [];
  const rows: BulkStudentRow[] = [];

  if (lines.length === 0) {
    return { rows, errors: [t("noRows")] };
  }

  let start = 0;
  const first = parseCsvLine(lines[0]!).map((h) => h.toLowerCase());
  const isHeader =
    first.includes("email") &&
    (first.includes("name") || first.includes("password"));
  if (isHeader) start = 1;

  for (let i = start; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]!);
    if (cols.length < 5) {
      errors.push(t("fixCsvErrors"));
      continue;
    }
    const [email, password, name, yearId, orderStr] = cols;
    if (!EMAIL_RE.test(email)) {
      errors.push(t("validRequired"));
      continue;
    }
    if (!password || password.length < 8) {
      errors.push(t("passwordMin"));
      continue;
    }
    if (!name?.trim()) {
      errors.push(t("validRequired"));
      continue;
    }
    if (!validYearIds.has(yearId)) {
      errors.push(t("selectYearError"));
      continue;
    }
    const order = Number(orderStr);
    if (!Number.isInteger(order) || order < 1 || order > 4) {
      errors.push(t("fixCsvErrors"));
      continue;
    }
    rows.push({
      email: email.toLowerCase(),
      password,
      name: name.trim(),
      currentAcademicYearId: yearId,
      currentYearOrder: order,
    });
  }

  return { rows, errors };
}

function downloadCsvTemplate(years: AcademicYear[]) {
  const exampleYearId = years[0]?._id ?? "PASTE_YEAR_ID";
  const content = [
    CSV_HEADERS.join(","),
    `student@example.com,SecurePass123!,Mohamed Student,${exampleYearId},1`,
  ].join("\n");
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "students-import-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function StudentAccountsPage() {
  const t = useTranslations("admin.students");
  const tc = useTranslations("common");

  const yearOrderOptions = useMemo(
    () =>
      [
        { value: 1, label: t("year1") },
        { value: 2, label: t("year2") },
        { value: 3, label: t("year3") },
        { value: 4, label: t("year4") },
      ] as const,
    [t],
  );

  const [tab, setTab] = useState<"single" | "bulk">("single");
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [students, setStudents] = useState<StudentUser[]>([]);
  const [loadingYears, setLoadingYears] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [password, setPassword] = useState("");
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "active" | "disabled">(
    "",
  );
  const [page, setPage] = useState(0);
  const [toast, setToast] = useState<{
    message: string;
    icon: string;
    error?: boolean;
  } | null>(null);

  const [bulkFileName, setBulkFileName] = useState("");
  const [bulkRows, setBulkRows] = useState<BulkStudentRow[]>([]);
  const [bulkParseErrors, setBulkParseErrors] = useState<string[]>([]);
  const [bulkResult, setBulkResult] = useState<BulkResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const yearIds = useMemo(() => new Set(years.map((y) => y._id)), [years]);
  const yearNameById = useMemo(
    () => new Map(years.map((y) => [y._id, y.name])),
    [years],
  );

  const showToast = useCallback(
    (message: string, icon: string, error = false) => {
      setToast({ message, icon, error });
    },
    [],
  );

  const loadYears = useCallback(async () => {
    setLoadingYears(true);
    try {
      const data = await api<{ academicYears: AcademicYear[] }>(
        "/api/academic-years",
      );
      setYears(data.academicYears.filter((y) => y.isActive));
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : t("loadYearsFailed"),
        "error",
        true,
      );
    } finally {
      setLoadingYears(false);
    }
  }, [showToast, t]);

  const loadStudents = useCallback(async () => {
    setLoadingStudents(true);
    try {
      const data = await api<{ users: StudentUser[] }>(
        "/api/users?role=STUDENT",
      );
      setStudents(data.users);
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : t("loadStudentsFailed"),
        "error",
        true,
      );
    } finally {
      setLoadingStudents(false);
    }
  }, [showToast, t]);

  useEffect(() => {
    loadYears();
    loadStudents();
  }, [loadYears, loadStudents]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    setPage(0);
  }, [search, yearFilter, statusFilter]);

  const filteredStudents = useMemo(() => {
    const term = search.trim().toLowerCase();
    return students.filter((s) => {
      if (term) {
        const match =
          s.name.toLowerCase().includes(term) ||
          s.email.toLowerCase().includes(term);
        if (!match) return false;
      }
      if (yearFilter && s.currentAcademicYearId !== yearFilter) return false;
      if (statusFilter === "active" && !s.isActive) return false;
      if (statusFilter === "disabled" && s.isActive) return false;
      return true;
    });
  }, [students, search, yearFilter, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE));
  const pagedStudents = filteredStudents.slice(
    page * PAGE_SIZE,
    page * PAGE_SIZE + PAGE_SIZE,
  );

  async function onSingleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim();
    const pwd = String(fd.get("password") ?? "");
    const currentAcademicYearId = String(fd.get("yearId") ?? "");
    const currentYearOrder = Number(fd.get("yearOrder"));

    if (!name || !email || !EMAIL_RE.test(email)) {
      showToast(t("validRequired"), "error", true);
      return;
    }
    if (pwd.length < 8) {
      showToast(t("passwordMin"), "error", true);
      return;
    }
    if (!currentAcademicYearId) {
      showToast(t("selectYearError"), "error", true);
      return;
    }

    setSubmitting(true);
    try {
      await api("/api/users/students", {
        method: "POST",
        body: JSON.stringify({
          name,
          email,
          password: pwd,
          currentAcademicYearId,
          currentYearOrder,
        }),
      });
      showToast(t("registerSuccess"), "check_circle");
      e.currentTarget.reset();
      setPassword("");
      await loadStudents();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : t("registerFailed"),
        "error",
        true,
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleCsvText(text: string, fileName: string) {
    const { rows, errors } = parseStudentsCsv(text, yearIds, t);
    setBulkFileName(fileName);
    setBulkRows(rows);
    setBulkParseErrors(errors);
    setBulkResult(null);
  }

  function onFileSelected(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      handleCsvText(String(reader.result ?? ""), file.name);
    };
    reader.readAsText(file);
  }

  async function onBulkImport() {
    if (bulkParseErrors.length > 0) {
      showToast(t("fixCsvErrors"), "error", true);
      return;
    }
    if (bulkRows.length === 0) {
      showToast(t("noRows"), "error", true);
      return;
    }

    setImporting(true);
    setBulkResult(null);
    try {
      const result = await api<BulkResult>("/api/users/students/bulk", {
        method: "POST",
        body: JSON.stringify({ students: bulkRows }),
      });
      setBulkResult(result);
      showToast(
        t("importSuccess", { count: result.created.length }),
        "cloud_done",
      );
      await loadStudents();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : t("importFailed"),
        "error",
        true,
      );
    } finally {
      setImporting(false);
    }
  }

  const tabBtn = (id: "single" | "bulk", label: string) => (
    <button
      type="button"
      className={`px-lg py-4 text-label-md transition-all ${
        tab === id
          ? "border-b-2 border-primary text-primary"
          : "text-on-surface-variant hover:text-on-surface"
      }`}
      onClick={() => setTab(id)}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-lg">
      <section className="space-y-sm">
        <h2 className="text-headline-xl font-bold text-on-surface">
          {t("title")}
        </h2>
        <p className="text-body-md text-on-surface-variant">
          {t("subtitle")}
        </p>
      </section>

      {/* Tabs */}
      <section className="overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container shadow-lg">
        <div className="flex border-b border-outline-variant">
          {tabBtn("single", t("tabSingle"))}
          {tabBtn("bulk", t("tabBulk"))}
        </div>

        <div className="p-lg">
          {tab === "single" ? (
            <div className="grid grid-cols-1 gap-lg md:grid-cols-12">
              <div className="space-y-md rounded-lg border border-outline-variant bg-surface-container-low p-lg md:col-span-5">
                <h3 className="text-headline-md font-semibold text-on-surface">
                  {t("registerNew")}
                </h3>
                <form className="space-y-md" onSubmit={onSingleSubmit}>
                  <div className="space-y-xs">
                    <label
                      htmlFor="student-name"
                      className="text-label-sm uppercase tracking-wider text-on-surface-variant"
                    >
                      {t("fullName")}
                    </label>
                    <input
                      id="student-name"
                      name="name"
                      required
                      className={inputClass}
                      placeholder={t("fullNamePlaceholder")}
                    />
                  </div>
                  <div className="space-y-xs">
                    <label
                      htmlFor="student-email"
                      className="text-label-sm uppercase tracking-wider text-on-surface-variant"
                    >
                      {t("email")}
                    </label>
                    <input
                      id="student-email"
                      name="email"
                      type="email"
                      required
                      className={inputClass}
                      placeholder={t("emailPlaceholder")}
                    />
                  </div>
                  <div className="space-y-xs">
                    <label
                      htmlFor="student-password"
                      className="text-label-sm uppercase tracking-wider text-on-surface-variant"
                    >
                      {t("password")}
                    </label>
                    <div className="flex gap-sm">
                      <input
                        id="student-password"
                        name="password"
                        type="text"
                        required
                        minLength={8}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`${inputClass} flex-1`}
                      />
                      <button
                        type="button"
                        className="rounded bg-secondary-container px-md text-label-sm text-on-secondary-container hover:brightness-110"
                        onClick={() => setPassword(randomPassword())}
                      >
                        {t("generate")}
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-md">
                    <div className="space-y-xs">
                      <label
                        htmlFor="student-year"
                        className="text-label-sm uppercase tracking-wider text-on-surface-variant"
                      >
                        {t("academicYear")}
                      </label>
                      <select
                        id="student-year"
                        name="yearId"
                        required
                        disabled={loadingYears}
                        className={inputClass}
                        defaultValue=""
                      >
                        <option value="" disabled>
                          {t("selectYear")}
                        </option>
                        {years.map((y) => (
                          <option key={y._id} value={y._id}>
                            {y.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-xs">
                      <label
                        htmlFor="student-order"
                        className="text-label-sm uppercase tracking-wider text-on-surface-variant"
                      >
                        {t("yearOrder")}
                      </label>
                      <select
                        id="student-order"
                        name="yearOrder"
                        defaultValue={1}
                        className={inputClass}
                      >
                        {yearOrderOptions.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={submitting || loadingYears}
                    className="mt-md flex w-full items-center justify-center gap-sm rounded bg-primary py-md font-label-md text-on-primary transition-all hover:brightness-95 disabled:opacity-60"
                  >
                    <MaterialIcon icon="person_add" className="text-[18px]" />
                    {submitting ? t("registering") : t("registerStudent")}
                  </button>
                </form>
              </div>
              <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-outline-variant p-xl opacity-60 transition-all hover:opacity-90 md:col-span-7">
                <div className="space-y-md text-center">
                  <MaterialIcon icon="school" className="text-[64px] text-primary" />
                  <p className="text-body-md text-on-surface-variant">
                    {t("singleHint")}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-lg">
              <details className="group rounded-lg bg-surface-container-high">
                <summary className="flex cursor-pointer list-none items-center justify-between p-md text-on-surface">
                  <span className="font-label-md">{t("bulkTitle")}</span>
                  <MaterialIcon
                    icon="expand_more"
                    className="transition-transform group-open:rotate-180"
                  />
                </summary>
                <div className="space-y-sm border-t border-outline-variant/30 p-md text-body-sm text-on-surface-variant">
                  <p>{t("bulkDesc")}</p>
                  <code className="block rounded bg-background p-sm text-primary">
                    {CSV_HEADERS.join(",")}
                  </code>
                  {years.length > 0 && (
                    <ul className="list-inside list-disc text-xs">
                      {years.map((y) => (
                        <li key={y._id}>
                          {y.name}: <span className="font-mono">{y._id}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </details>

              <div className="grid grid-cols-1 gap-lg md:grid-cols-2">
                <div
                  className="flex cursor-pointer flex-col items-center justify-center space-y-md rounded-xl border-2 border-dashed border-outline-variant bg-surface-container-low p-xl transition-colors hover:border-primary"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (file) onFileSelected(file);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      fileInputRef.current?.click();
                    }
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={(e) => onFileSelected(e.target.files?.[0] ?? null)}
                  />
                  <MaterialIcon icon="upload_file" className="text-[48px] text-outline" />
                  <div className="text-center">
                    <p className="font-label-md">{t("dropCsv")}</p>
                  </div>
                  <button
                    type="button"
                    className="mt-md flex items-center gap-xs font-label-md text-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadCsvTemplate(years);
                    }}
                  >
                    <MaterialIcon icon="download" className="text-[18px]" />
                    {t("downloadTemplate")}
                  </button>
                </div>

                {(bulkRows.length > 0 || bulkParseErrors.length > 0) && (
                  <div className="space-y-md rounded-lg border border-outline-variant bg-surface-container-low p-md">
                    <h4 className="text-label-md text-on-surface-variant">
                      {t("bulkTitle")}
                      {bulkFileName && (
                        <span className="text-on-surface">: {bulkFileName}</span>
                      )}
                    </h4>
                    {bulkParseErrors.length > 0 && (
                      <ul className="list-inside list-disc rounded bg-error-container/20 p-xs text-xs text-error">
                        {bulkParseErrors.map((err) => (
                          <li key={err}>{err}</li>
                        ))}
                      </ul>
                    )}
                    {bulkRows.length > 0 && (
                      <>
                        <div className="max-h-48 overflow-auto">
                          <table className="w-full text-start text-body-sm">
                            <thead className="sticky top-0 bg-surface-container-high text-label-sm uppercase text-on-surface-variant">
                              <tr>
                                <th className="p-sm">{t("colName")}</th>
                                <th className="p-sm">{t("colEmail")}</th>
                                <th className="p-sm">{t("colYear")}</th>
                                <th className="p-sm">{t("yearOrder")}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant/20">
                              {bulkRows.slice(0, 5).map((r) => (
                                <tr key={r.email}>
                                  <td className="p-sm">{r.name}</td>
                                  <td className="p-sm">{r.email}</td>
                                  <td className="max-w-[80px] truncate p-sm font-mono text-xs">
                                    {r.currentAcademicYearId}
                                  </td>
                                  <td className="p-sm">{r.currentYearOrder}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {bulkRows.length > 5 && (
                          <p className="text-label-sm text-on-surface-variant">
                            {t("rowsReady", { count: bulkRows.length - 5 })}
                          </p>
                        )}
                        <button
                          type="button"
                          disabled={importing || bulkParseErrors.length > 0}
                          className="flex w-full items-center justify-center gap-sm rounded bg-primary py-md font-label-md text-on-primary disabled:opacity-60"
                          onClick={onBulkImport}
                        >
                          <MaterialIcon icon="cloud_upload" className="text-[18px]" />
                          {importing ? t("importing") : t("importStudents")}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {bulkResult && (
                <div className="grid grid-cols-1 gap-md rounded-lg border border-outline-variant border-l-4 border-l-primary bg-surface-container-low p-md md:grid-cols-2">
                  <div>
                    <h4 className="mb-2 font-label-md text-on-surface">
                      {t("bulkTitle")}
                    </h4>
                    <div className="flex items-center gap-md font-label-md text-primary">
                      <MaterialIcon icon="check_circle" />
                      {t("importSuccess", { count: bulkResult.created.length })}
                    </div>
                  </div>
                  {bulkResult.errors.length > 0 && (
                    <div className="border-l border-outline-variant/30 pl-md md:border-l">
                      <p className="flex items-center gap-xs font-label-md text-error">
                        <MaterialIcon icon="error" className="text-[18px]" />
                        {t("importFailed")}
                      </p>
                      <ul className="mt-xs list-inside list-disc rounded bg-error-container/20 p-xs text-xs text-on-error-container">
                        {bulkResult.errors.map((e) => (
                          <li key={`${e.email}-${e.error}`}>
                            {e.email}: {e.error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Student directory */}
      <section className="rounded-xl border border-outline-variant bg-surface-container-low shadow-lg">
        <div className="flex flex-col gap-md border-b border-outline-variant p-lg md:flex-row md:items-center md:justify-between">
          <h3 className="text-headline-md font-semibold text-on-surface">
            {t("directory")}
          </h3>
          <div className="flex w-full flex-wrap gap-sm md:w-auto">
            <div className="relative min-w-[12rem] flex-1 md:w-64">
              <MaterialIcon
                icon="filter_list"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded border border-outline-variant bg-background py-2 pl-10 pr-4 text-body-sm outline-none focus:border-primary"
                placeholder={t("searchPlaceholder")}
              />
            </div>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="rounded border border-outline-variant bg-background px-md py-2 text-body-sm outline-none focus:border-primary"
            >
              <option value="">{t("filterAllYears")}</option>
              {years.map((y) => (
                <option key={y._id} value={y._id}>
                  {y.name}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as "" | "active" | "disabled")
              }
              className="rounded border border-outline-variant bg-background px-md py-2 text-body-sm outline-none focus:border-primary"
            >
              <option value="">{t("filterAllStatus")}</option>
              <option value="active">{t("active")}</option>
              <option value="disabled">{t("disabled")}</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start">
            <thead className="border-b border-outline-variant bg-surface-container-high/50 text-label-md uppercase tracking-widest text-on-surface-variant">
              <tr>
                <th className="px-lg py-md">{t("colName")}</th>
                <th className="px-lg py-md">{t("colEmail")}</th>
                <th className="px-lg py-md">{t("colYear")}</th>
                <th className="px-lg py-md">{t("yearOrder")}</th>
                <th className="px-lg py-md">{t("colStatus")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {loadingStudents ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-lg py-xl text-center text-body-sm text-on-surface-variant"
                  >
                    {tc("loading")}
                  </td>
                </tr>
              ) : pagedStudents.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-lg py-xl text-center text-body-sm text-on-surface-variant"
                  >
                    {students.length === 0 ? t("noStudents") : t("noResults")}
                  </td>
                </tr>
              ) : (
                pagedStudents.map((s) => (
                  <tr
                    key={s._id}
                    className="transition-colors hover:bg-surface-container"
                  >
                    <td className="px-lg py-md font-medium text-on-surface">
                      {s.name}
                    </td>
                    <td className="px-lg py-md text-on-surface-variant">
                      {s.email}
                    </td>
                    <td className="px-lg py-md text-on-surface-variant">
                      {s.currentAcademicYearId
                        ? (yearNameById.get(s.currentAcademicYearId) ?? "—")
                        : "—"}
                    </td>
                    <td className="px-lg py-md text-on-surface-variant">
                      {yearOrderLabel(s.currentYearOrder, t)}
                    </td>
                    <td className="px-lg py-md">
                      {s.isActive ? (
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-sm py-1 text-xs font-label-md text-primary">
                          {t("active")}
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-surface-variant px-sm py-1 text-xs font-label-md text-on-surface-variant">
                          {t("disabled")}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-outline-variant bg-surface-container-low p-md">
          <span className="text-label-sm text-on-surface-variant">
            {t("pageOf", { page: page + 1, total: pageCount })}
          </span>
          <div className="flex gap-xs">
            <button
              type="button"
              className="rounded p-1 hover:bg-surface-container-high disabled:opacity-30"
              disabled={page <= 0}
              onClick={() => setPage((p) => p - 1)}
              aria-label={tc("paginationPrevious")}
            >
              <MaterialIcon icon="chevron_left" />
            </button>
            <button
              type="button"
              className="rounded p-1 hover:bg-surface-container-high disabled:opacity-30"
              disabled={page >= pageCount - 1}
              onClick={() => setPage((p) => p + 1)}
              aria-label={tc("paginationNext")}
            >
              <MaterialIcon icon="chevron_right" />
            </button>
          </div>
        </div>
      </section>

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
