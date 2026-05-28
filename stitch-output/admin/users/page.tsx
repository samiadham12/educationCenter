"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { MaterialIcon } from "../../components/MaterialIcon";
import { api } from "../../lib/api";

type Student = {
  _id: string;
  email: string;
  name: string;
  currentYearOrder?: number;
};

type Subscription = {
  _id: string;
  userId: string;
  type: "TERM" | "FULL_YEAR";
  termId?: string;
  academicYearId: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
};

type AcademicYear = { _id: string; name: string };
type Term = { _id: string; name: string; academicYearId: string };

type SubFilter = "all" | "active" | "none";

const selectClass =
  "h-10 w-full rounded-lg border border-outline-variant bg-surface px-md text-body-sm text-on-surface outline-none transition-all focus:border-primary";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function formatDateRange(start: string, end: string): string {
  const s = new Date(start).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const e = new Date(end).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${s} – ${e}`;
}

export default function UsersSubscriptionsPage() {
  const t = useTranslations("admin.users");
  const tc = useTranslations("common");
  const tStudents = useTranslations("admin.students");

  const [students, setStudents] = useState<Student[]>([]);
  const [allSubscriptions, setAllSubscriptions] = useState<Subscription[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [allTerms, setAllTerms] = useState<Term[]>([]);
  const [formTerms, setFormTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [subFilter, setSubFilter] = useState<SubFilter>("all");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [userSubscriptions, setUserSubscriptions] = useState<Subscription[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);

  const [subType, setSubType] = useState<"TERM" | "FULL_YEAR">("FULL_YEAR");
  const [yearId, setYearId] = useState("");
  const [termId, setTermId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<Subscription | null>(null);
  const [revoking, setRevoking] = useState(false);

  const [toast, setToast] = useState<{
    message: string;
    icon: string;
    error?: boolean;
  } | null>(null);

  const showToast = useCallback(
    (message: string, icon: string, error = false) => {
      setToast({ message, icon, error });
    },
    [],
  );

  const yearNameById = useMemo(
    () => new Map(years.map((y) => [y._id, y.name])),
    [years],
  );
  const termNameById = useMemo(
    () => new Map(allTerms.map((t) => [t._id, t.name])),
    [allTerms],
  );

  const activeCountByUser = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of allSubscriptions) {
      if (!s.isActive) continue;
      const uid = String(s.userId);
      map.set(uid, (map.get(uid) ?? 0) + 1);
    }
    return map;
  }, [allSubscriptions]);

  const loadBase = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, subsRes, yearsRes] = await Promise.all([
        api<{ users: Student[] }>("/api/users?role=STUDENT"),
        api<{ subscriptions: Subscription[] }>("/api/subscriptions"),
        api<{ academicYears: AcademicYear[] }>("/api/academic-years"),
      ]);
      setStudents(usersRes.users);
      setAllSubscriptions(
        subsRes.subscriptions.map((s) => ({
          ...s,
          userId: String(s.userId),
        })),
      );
      setYears(yearsRes.academicYears);
      const termsList: Term[] = [];
      for (const year of yearsRes.academicYears) {
        try {
          const { terms: yearTerms } = await api<{ terms: Term[] }>(
            `/api/terms?academicYearId=${year._id}`,
          );
          termsList.push(...yearTerms);
        } catch {
          /* skip year */
        }
      }
      setAllTerms(termsList);
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : t("loadFailed"),
        "error",
        true,
      );
    } finally {
      setLoading(false);
    }
  }, [showToast, t]);

  useEffect(() => {
    loadBase();
  }, [loadBase]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!yearId) {
      setFormTerms([]);
      setTermId("");
      return;
    }
    api<{ terms: Term[] }>(`/api/terms?academicYearId=${yearId}`)
      .then((d) => setFormTerms(d.terms))
      .catch(() => setFormTerms([]));
  }, [yearId]);

  const filteredStudents = useMemo(() => {
    const term = search.trim().toLowerCase();
    return students.filter((u) => {
      if (term) {
        const match =
          u.name.toLowerCase().includes(term) ||
          u.email.toLowerCase().includes(term);
        if (!match) return false;
      }
      const active = activeCountByUser.get(u._id) ?? 0;
      if (subFilter === "active" && active === 0) return false;
      if (subFilter === "none" && active > 0) return false;
      return true;
    });
  }, [students, search, subFilter, activeCountByUser]);

  const openDrawer = async (student: Student) => {
    setSelectedStudent(student);
    setDrawerOpen(true);
    setSubType("FULL_YEAR");
    setYearId("");
    setTermId("");
    setStartDate("");
    setEndDate("");
    setLoadingSubs(true);
    try {
      const data = await api<{ subscriptions: Subscription[] }>(
        `/api/subscriptions?userId=${student._id}`,
      );
      setUserSubscriptions(
        data.subscriptions.map((s) => ({
          ...s,
          userId: String(s.userId),
        })),
      );
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : t("loadSubsFailed"),
        "error",
        true,
      );
    } finally {
      setLoadingSubs(false);
    }
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedStudent(null);
    setRevokeTarget(null);
  };

  async function refreshAfterChange() {
    await loadBase();
    if (selectedStudent) {
      const data = await api<{ subscriptions: Subscription[] }>(
        `/api/subscriptions?userId=${selectedStudent._id}`,
      );
      setUserSubscriptions(
        data.subscriptions.map((s) => ({
          ...s,
          userId: String(s.userId),
        })),
      );
    }
  }

  async function onAssign(e: FormEvent) {
    e.preventDefault();
    if (!selectedStudent) return;

    if (!yearId) {
      showToast(t("selectYearError"), "error", true);
      return;
    }
    if (subType === "TERM" && !termId) {
      showToast(t("selectTermError"), "error", true);
      return;
    }
    if (!startDate || !endDate) {
      showToast(t("datesRequired"), "error", true);
      return;
    }
    if (new Date(endDate) <= new Date(startDate)) {
      showToast(t("endAfterStart"), "error", true);
      return;
    }

    setAssigning(true);
    try {
      await api("/api/subscriptions", {
        method: "POST",
        body: JSON.stringify({
          userId: selectedStudent._id,
          type: subType,
          academicYearId: yearId,
          ...(subType === "TERM" ? { termId } : {}),
          startDate,
          endDate,
          isActive: true,
        }),
      });
      showToast(t("assignSuccess"), "assignment_turned_in");
      setStartDate("");
      setEndDate("");
      setTermId("");
      await refreshAfterChange();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : t("assignFailed"),
        "error",
        true,
      );
    } finally {
      setAssigning(false);
    }
  }

  function typeLabel(type: Subscription["type"]): string {
    return type === "TERM" ? t("termSub") : t("fullYearSub");
  }

  function yearOrderLabel(order: number | undefined): string {
    if (!order || order < 1 || order > 4) return "—";
    const keys = ["year1", "year2", "year3", "year4"] as const;
    return tStudents(keys[order - 1]!);
  }

  async function confirmRevoke() {
    if (!revokeTarget) return;
    setRevoking(true);
    try {
      await api(`/api/subscriptions/${revokeTarget._id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: false }),
      });
      showToast(t("revokeSuccess"), "block");
      setRevokeTarget(null);
      await refreshAfterChange();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : t("revokeFailed"),
        "error",
        true,
      );
    } finally {
      setRevoking(false);
    }
  }

  function subDescription(sub: Subscription): string {
    const year =
      yearNameById.get(sub.academicYearId) ?? t("academicYear");
    if (sub.type === "TERM" && sub.termId) {
      const term = termNameById.get(sub.termId) ?? t("term");
      return `${year} · ${term}`;
    }
    return year;
  }

  const filterBtn = (id: SubFilter, label: string) => (
    <button
      type="button"
      className={`rounded-lg px-md py-1.5 text-label-md transition-all ${
        subFilter === id
          ? "bg-primary text-on-primary"
          : "text-on-surface-variant hover:text-on-surface"
      }`}
      onClick={() => setSubFilter(id)}
    >
      {label}
    </button>
  );

  return (
    <div className="mx-auto max-w-container-max space-y-lg">
      <div className="flex flex-col justify-between gap-md md:flex-row md:items-center">
        <h2 className="text-headline-xl font-bold text-on-surface">
          {t("pageTitle")}
        </h2>
        <div className="flex rounded-xl border border-outline-variant bg-surface-container-high p-1">
          {filterBtn("all", t("filterAll"))}
          {filterBtn("active", t("filterActive"))}
          {filterBtn("none", t("filterNone"))}
        </div>
      </div>

      <div className="relative">
        <MaterialIcon
          icon="search"
          className="absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant"
        />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="w-full rounded-xl border border-outline-variant bg-surface-container py-sm pl-xl pr-md text-body-sm text-on-surface outline-none focus:border-primary md:max-w-md"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-start">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-container-high">
                <th className="px-lg py-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  {t("colName")}
                </th>
                <th className="px-lg py-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  {t("colEmail")}
                </th>
                <th className="px-lg py-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  {t("colYearOrder")}
                </th>
                <th className="px-lg py-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  {t("colActiveSubs")}
                </th>
                <th className="px-lg py-md text-end text-label-md uppercase tracking-wider text-on-surface-variant">
                  {t("colActions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-lg py-xl text-center text-body-sm text-on-surface-variant"
                  >
                    {t("loadingStudents")}
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-lg py-xl text-center text-body-sm text-on-surface-variant"
                  >
                    {t("noMatch")}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((u) => {
                  const active = activeCountByUser.get(u._id) ?? 0;
                  return (
                    <tr
                      key={u._id}
                      className="transition-colors hover:bg-surface-variant/30"
                    >
                      <td className="px-lg py-md">
                        <div className="flex items-center gap-md">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-container font-bold text-on-secondary-container">
                            {getInitials(u.name)}
                          </div>
                          <span className="font-medium text-on-surface">
                            {u.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-lg py-md text-body-sm text-on-surface-variant">
                        {u.email}
                      </td>
                      <td className="px-lg py-md text-body-sm text-on-surface">
                        {yearOrderLabel(u.currentYearOrder)}
                      </td>
                      <td className="px-lg py-md">
                        <span
                          className={`inline-flex items-center justify-center rounded-full border px-3 py-1 text-label-sm ${
                            active > 0
                              ? "border-primary/30 bg-primary-container/20 text-primary"
                              : "border-outline-variant bg-surface-variant text-on-surface-variant"
                          }`}
                        >
                          {active} {t("active")}
                        </span>
                      </td>
                      <td className="px-lg py-md text-end">
                        <button
                          type="button"
                          className="rounded-lg border border-primary px-md py-1.5 text-label-md text-primary transition-all hover:bg-primary hover:text-on-primary active:scale-95"
                          onClick={() => openDrawer(u)}
                        >
                          {t("manage")}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer overlay */}
      <div
        className={`fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm transition-opacity duration-300 ${
          drawerOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        onClick={closeDrawer}
        aria-hidden={!drawerOpen}
      />

      {/* Side drawer */}
      <aside
        className={`drawer-transition fixed right-0 top-0 z-[70] flex h-screen w-full max-w-[480px] flex-col border-l border-outline-variant bg-surface-container ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!drawerOpen}
      >
        {selectedStudent && (
          <>
            <div className="flex items-start justify-between border-b border-outline-variant bg-surface-container-high px-lg py-lg">
              <div className="space-y-xs">
                <h3 className="text-headline-md font-semibold text-on-surface">
                  {selectedStudent.name}
                </h3>
                <p className="text-body-sm text-on-surface-variant">
                  {selectedStudent.email}
                </p>
              </div>
              <button
                type="button"
                className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-variant"
                onClick={closeDrawer}
                aria-label={t("closePanel")}
              >
                <MaterialIcon icon="close" />
              </button>
            </div>

            <div className="flex-1 space-y-xl overflow-y-auto p-lg">
              {/* Current subscriptions */}
              <section className="space-y-md">
                <div className="flex items-center gap-sm">
                  <MaterialIcon icon="verified" className="text-primary" />
                  <h4 className="text-label-md uppercase tracking-widest text-on-surface-variant">
                    {t("drawerTitle")}
                  </h4>
                </div>
                {loadingSubs ? (
                  <p className="text-body-sm text-on-surface-variant">
                    {tc("loading")}
                  </p>
                ) : userSubscriptions.length === 0 ? (
                  <p className="text-body-sm text-on-surface-variant">
                    {t("noMatch")}
                  </p>
                ) : (
                  <div className="space-y-md">
                    {userSubscriptions.map((sub) => (
                      <div
                        key={sub._id}
                        className={`flex items-center justify-between rounded-xl border border-outline-variant bg-surface p-md ${
                          !sub.isActive ? "opacity-60" : ""
                        }`}
                      >
                        <div className="space-y-xs">
                          <div className="flex flex-wrap items-center gap-md">
                            <span className="text-label-md text-on-surface">
                              {typeLabel(sub.type)}
                            </span>
                            <span
                              className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                sub.isActive
                                  ? "border-primary/30 bg-primary-container/20 text-primary"
                                  : "border-outline-variant bg-surface-variant text-on-surface-variant"
                              }`}
                            >
                              {sub.isActive ? t("active") : t("revoked")}
                            </span>
                          </div>
                          <p className="text-body-sm text-on-surface-variant">
                            {subDescription(sub)}
                          </p>
                          <p className="text-label-sm italic text-on-surface-variant">
                            {formatDateRange(sub.startDate, sub.endDate)}
                          </p>
                        </div>
                        {sub.isActive && (
                          <button
                            type="button"
                            className="shrink-0 rounded-lg px-md py-1.5 text-label-md text-error transition-all hover:bg-error-container/20 active:scale-95"
                            onClick={() => setRevokeTarget(sub)}
                          >
                            {t("revoke")}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Assign form */}
              <section className="space-y-md">
                <div className="flex items-center gap-sm">
                  <MaterialIcon icon="add_circle" className="text-primary" />
                  <h4 className="text-label-md uppercase tracking-widest text-on-surface-variant">
                    {t("assignTitle")}
                  </h4>
                </div>
                <form
                  className="space-y-lg rounded-xl border border-outline-variant bg-surface-container-low p-lg"
                  onSubmit={onAssign}
                >
                  <div className="flex w-fit rounded-xl border border-outline-variant bg-surface-container-high p-1">
                    <button
                      type="button"
                      className={`rounded-lg px-md py-1.5 text-label-md transition-all ${
                        subType === "TERM"
                          ? "bg-primary text-on-primary"
                          : "text-on-surface-variant"
                      }`}
                      onClick={() => setSubType("TERM")}
                    >
                      {t("term")}
                    </button>
                    <button
                      type="button"
                      className={`rounded-lg px-md py-1.5 text-label-md transition-all ${
                        subType === "FULL_YEAR"
                          ? "bg-primary text-on-primary"
                          : "text-on-surface-variant"
                      }`}
                      onClick={() => {
                        setSubType("FULL_YEAR");
                        setTermId("");
                      }}
                    >
                      {t("fullYearSub")}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-md">
                    <div className="space-y-xs">
                      <label className="text-label-md text-on-surface">
                        {t("academicYear")}
                      </label>
                      <select
                        className={selectClass}
                        value={yearId}
                        onChange={(e) => setYearId(e.target.value)}
                        required
                      >
                        <option value="">{t("selectYear")}</option>
                        {years.map((y) => (
                          <option key={y._id} value={y._id}>
                            {y.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {subType === "TERM" && (
                      <div className="space-y-xs">
                        <label className="text-label-md text-on-surface">
                          {t("term")}
                        </label>
                        <select
                          className={selectClass}
                          value={termId}
                          onChange={(e) => setTermId(e.target.value)}
                          required
                          disabled={!yearId}
                        >
                          <option value="">{t("selectTerm")}</option>
                          {formTerms.map((t) => (
                            <option key={t._id} value={t._id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-md">
                      <div className="space-y-xs">
                        <label className="text-label-md text-on-surface">
                          {t("startDate")}
                        </label>
                        <input
                          type="date"
                          className={selectClass}
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-xs">
                        <label className="text-label-md text-on-surface">
                          {t("endDate")}
                        </label>
                        <input
                          type="date"
                          className={selectClass}
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={assigning}
                    className="flex w-full items-center justify-center gap-sm rounded-lg bg-primary py-md font-bold text-label-md text-on-primary transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
                  >
                    <MaterialIcon icon="assignment_turned_in" className="text-[20px]" />
                    {assigning ? t("assigning") : t("assignSubscription")}
                  </button>
                </form>
              </section>
            </div>
          </>
        )}
      </aside>

      {/* Revoke confirm */}
      {revokeTarget && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-background/80 p-lg backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-outline-variant bg-surface-container p-lg shadow-xl">
            <h5 className="text-headline-md font-semibold text-on-surface">
              {t("revokeTitle")}
            </h5>
            <p className="mt-md text-body-md text-on-surface-variant">
              {t("revokeDesc")}
            </p>
            <div className="mt-xl flex gap-md">
              <button
                type="button"
                className="flex-1 rounded bg-surface-variant py-md font-label-md"
                onClick={() => setRevokeTarget(null)}
                disabled={revoking}
              >
                {tc("cancel")}
              </button>
              <button
                type="button"
                className="flex-1 rounded bg-error py-md font-label-md text-on-error"
                onClick={confirmRevoke}
                disabled={revoking}
              >
                {revoking ? t("revoking") : t("revoke")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      <div
        className={`pointer-events-none fixed bottom-lg right-lg z-[100] transition-all duration-300 ${
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
