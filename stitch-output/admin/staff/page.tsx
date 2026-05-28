"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { MaterialIcon } from "../../components/MaterialIcon";
import { api } from "../../lib/api";

type StaffRole = "ADMIN" | "MODERATOR";

type StaffUser = {
  _id: string;
  email: string;
  name: string;
  role: StaffRole;
  isActive: boolean;
  createdAt: string;
};

type StaffListResponse = {
  users: StaffUser[];
};

const inputClass =
  "w-full rounded-lg border border-outline-variant bg-background px-md py-sm text-body-md text-on-surface outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function passwordStrength(
  password: string,
  labels: {
    empty: string;
    weak: string;
    medium: string;
    strong: string;
    veryStrong: string;
  },
): {
  label: string;
  bars: number;
} {
  if (!password) return { label: labels.empty, bars: 0 };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1) return { label: labels.weak, bars: 1 };
  if (score === 2) return { label: labels.medium, bars: 2 };
  if (score === 3) return { label: labels.strong, bars: 3 };
  return { label: labels.veryStrong, bars: 4 };
}

function roleBadgeClass(role: StaffRole): string {
  return role === "ADMIN"
    ? "border-secondary/30 bg-secondary-container/20 text-secondary"
    : "border-tertiary/30 bg-tertiary-container/20 text-tertiary";
}

function TableSkeleton() {
  return (
    <tr className="animate-pulse">
      <td className="px-lg py-md">
        <div className="flex items-center gap-md">
          <div className="h-9 w-9 rounded bg-surface-variant/50" />
          <div className="space-y-xs">
            <div className="h-3 w-32 rounded bg-surface-variant/50" />
            <div className="h-2 w-24 rounded bg-surface-variant/30" />
          </div>
        </div>
      </td>
      <td className="px-lg py-md">
        <div className="h-4 w-16 rounded bg-surface-variant/50" />
      </td>
      <td className="px-lg py-md">
        <div className="h-3 w-12 rounded bg-surface-variant/50" />
      </td>
      <td className="px-lg py-md">
        <div className="h-3 w-20 rounded bg-surface-variant/30" />
      </td>
      <td className="px-lg py-md text-right">
        <div className="ml-auto h-6 w-20 rounded bg-surface-variant/50" />
      </td>
    </tr>
  );
}

export default function StaffAccountsPage() {
  const t = useTranslations("admin.staff");
  const tc = useTranslations("common");
  const tRoles = useTranslations("roles");
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [toast, setToast] = useState<{
    message: string;
    icon: string;
    error?: boolean;
  } | null>(null);
  const [disableTarget, setDisableTarget] = useState<StaffUser | null>(null);
  const [disabling, setDisabling] = useState(false);

  const strength = passwordStrength(password, {
    empty: t("enterPassword"),
    weak: t("weak"),
    medium: t("medium"),
    strong: t("strong"),
    veryStrong: t("veryStrong"),
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<StaffListResponse>(
        "/api/users?role=ADMIN,MODERATOR",
      );
      setUsers(data.users);
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : t("loadFailed"),
        "error",
        true,
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  function showToast(message: string, icon: string, error = false) {
    setToast({ message, icon, error });
  }

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term),
    );
  }, [users, search]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim();
    const pwd = String(fd.get("password") ?? "");
    const role = String(fd.get("role") ?? "ADMIN") as StaffRole;

    if (!name || name.length > 100) {
      showToast(t("nameRequired"), "error", true);
      return;
    }
    if (!email) {
      showToast(t("emailRequired"), "error", true);
      return;
    }
    if (pwd.length < 8) {
      showToast(t("passwordMin"), "error", true);
      return;
    }
    if (role !== "ADMIN" && role !== "MODERATOR") {
      showToast(t("invalidRole"), "error", true);
      return;
    }

    setSubmitting(true);
    try {
      await api("/api/users/staff", {
        method: "POST",
        body: JSON.stringify({ name, email, password: pwd, role }),
      });
      showToast(t("createSuccess"), "check_circle");
      e.currentTarget.reset();
      setPassword("");
      await load();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : t("createFailed"),
        "error",
        true,
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDisable() {
    if (!disableTarget) return;
    setDisabling(true);
    try {
      await api(`/api/users/${disableTarget._id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: false }),
      });
      showToast(t("disabledSuccess", { name: disableTarget.name }), "person_off");
      setDisableTarget(null);
      await load();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : t("disableFailed"),
        "error",
        true,
      );
    } finally {
      setDisabling(false);
    }
  }

  const showEmpty =
    !loading && users.length === 0 && search.trim() === "";
  const showNoResults =
    !loading && filtered.length === 0 && search.trim() !== "";

  return (
    <div className="space-y-xl">
      <div>
        <h2 className="mb-xs text-headline-xl font-bold text-on-surface">
          {t("title")}
        </h2>
        <p className="text-body-md text-on-surface-variant">{t("subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 items-start gap-lg xl:grid-cols-12">
        {/* Create form */}
        <section className="space-y-lg xl:col-span-4">
          <div className="rounded-xl border border-outline-variant bg-surface-container p-lg shadow-sm">
            <div className="mb-lg flex items-center gap-sm border-b border-outline-variant pb-md">
              <MaterialIcon icon="person_add" className="text-primary" />
              <h3 className="text-headline-md font-semibold text-on-surface">
                {t("createNewStaff")}
              </h3>
            </div>
            <form className="space-y-md" onSubmit={onSubmit}>
              <div>
                <label
                  htmlFor="staff-name"
                  className="mb-xs block text-label-md text-on-surface-variant"
                >
                  {t("fullName")}
                </label>
                <input
                  id="staff-name"
                  name="name"
                  type="text"
                  required
                  maxLength={100}
                  className={inputClass}
                  placeholder={t("fullNamePlaceholder")}
                />
              </div>
              <div>
                <label
                  htmlFor="staff-email"
                  className="mb-xs block text-label-md text-on-surface-variant"
                >
                  {t("email")}
                </label>
                <input
                  id="staff-email"
                  name="email"
                  type="email"
                  required
                  className={inputClass}
                  placeholder="j.rivers@institution.edu"
                />
              </div>
              <div>
                <label
                  htmlFor="staff-password"
                  className="mb-xs block text-label-md text-on-surface-variant"
                >
                  {t("initialPassword")}
                </label>
                <div className="relative">
                  <input
                    id="staff-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${inputClass} pr-xl`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute right-md top-1/2 -translate-y-1/2 text-on-surface-variant transition-colors hover:text-primary"
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
                <div className="mt-xs flex items-center justify-between">
                  <div className="flex gap-xs">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-1 w-6 rounded-full ${
                          i <= strength.bars ? "bg-primary" : "bg-outline-variant"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] uppercase tracking-tighter text-on-surface-variant">
                    {t("strength")} {strength.label}
                  </span>
                </div>
                <p className="mt-xs text-[11px] text-on-surface-variant">
                  {t("passwordHint")}
                </p>
              </div>
              <div>
                <label
                  htmlFor="staff-role"
                  className="mb-xs block text-label-md text-on-surface-variant"
                >
                  {t("adminRole")}
                </label>
                <select
                  id="staff-role"
                  name="role"
                  defaultValue="ADMIN"
                  className={`${inputClass} appearance-none`}
                >
                  <option value="MODERATOR">{tRoles("MODERATOR")}</option>
                  <option value="ADMIN">{tRoles("ADMIN")}</option>
                </select>
              </div>
              <div className="pt-md">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-sm rounded-lg bg-primary py-md text-label-md text-on-primary transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
                >
                  <MaterialIcon icon="how_to_reg" className="text-[18px]" />
                  {submitting ? t("creating") : t("createStaffAccount")}
                </button>
              </div>
            </form>
          </div>

          <div className="flex items-start gap-md rounded-lg border border-outline-variant/50 bg-surface-container-low p-md">
            <MaterialIcon icon="info" className="text-tertiary" />
            <div>
              <p className="mb-xs text-label-md text-on-surface">
                {t("rolePermissions")}
              </p>
              <p className="text-body-sm text-on-surface-variant">
                {t("rolePermissionsDesc")}
              </p>
            </div>
          </div>
        </section>

        {/* Staff table */}
        <section className="xl:col-span-8">
          <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container shadow-sm">
            <div className="flex flex-col justify-between gap-md border-b border-outline-variant p-lg md:flex-row md:items-center">
              <div className="flex items-center gap-sm">
                <MaterialIcon icon="groups" className="text-primary" />
                <h3 className="text-headline-md font-semibold text-on-surface">
                  {t("staffDirectory")}
                </h3>
              </div>
              <div className="relative w-full max-w-sm">
                <MaterialIcon
                  icon="search"
                  className="absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant"
                />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-full border border-outline-variant bg-background py-sm pl-xl pr-md text-body-sm text-on-surface outline-none placeholder:text-on-surface-variant focus:border-primary focus:ring-0"
                  placeholder={t("filterPlaceholder")}
                />
              </div>
            </div>

            {showEmpty ? (
              <div className="p-xl text-center">
                <div className="mb-md inline-flex h-20 w-20 items-center justify-center rounded-full border border-outline-variant/30 bg-surface-container-high">
                  <MaterialIcon
                    icon="person_off"
                    className="text-[40px] opacity-20 text-on-surface-variant"
                  />
                </div>
                <h4 className="mb-xs text-headline-md font-semibold text-on-surface">
                  {t("noStaffYet")}
                </h4>
                <p className="mx-auto max-w-xs text-body-md text-on-surface-variant">
                  {t("noStaffDesc")}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-outline-variant bg-surface-container-high">
                      <th className="px-lg py-md text-label-md uppercase tracking-wider text-on-surface-variant">
                        {t("colName")}
                      </th>
                      <th className="px-lg py-md text-label-md uppercase tracking-wider text-on-surface-variant">
                        {t("colRole")}
                      </th>
                      <th className="px-lg py-md text-label-md uppercase tracking-wider text-on-surface-variant">
                        {t("colStatus")}
                      </th>
                      <th className="px-lg py-md text-label-md uppercase tracking-wider text-on-surface-variant">
                        {t("colCreated")}
                      </th>
                      <th className="px-lg py-md text-end text-label-md uppercase tracking-wider text-on-surface-variant">
                        {t("colActions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/30">
                    {loading ? (
                      <>
                        <TableSkeleton />
                        <TableSkeleton />
                      </>
                    ) : showNoResults ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-lg py-xl text-center text-body-sm text-on-surface-variant"
                        >
                          {t("noSearchResults")}
                        </td>
                      </tr>
                    ) : (
                      filtered.map((u) => (
                        <tr
                          key={u._id}
                          className={`group transition-colors hover:bg-surface-container-highest ${
                            !u.isActive ? "opacity-60 grayscale-[0.5]" : ""
                          }`}
                        >
                          <td className="px-lg py-md">
                            <div className="flex items-center gap-md">
                              <div className="flex h-9 w-9 items-center justify-center rounded bg-surface-variant font-bold text-primary">
                                {getInitials(u.name)}
                              </div>
                              <div>
                                <p className="text-label-md text-on-surface">
                                  {u.name}
                                </p>
                                <p className="text-[12px] text-on-surface-variant">
                                  {u.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-lg py-md">
                            <span
                              className={`rounded border px-sm py-[2px] text-[11px] font-bold uppercase tracking-widest ${roleBadgeClass(u.role)}`}
                            >
                              {tRoles(u.role)}
                            </span>
                          </td>
                          <td className="px-lg py-md">
                            {u.isActive ? (
                              <div className="flex items-center gap-xs">
                                <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(76,219,204,0.5)]" />
                                <span className="text-body-sm text-primary">
                                  {t("active")}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-xs">
                                <span className="h-2 w-2 rounded-full bg-outline" />
                                <span className="text-body-sm text-on-surface-variant">
                                  {t("disabled")}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-lg py-md">
                            <p className="text-body-sm text-on-surface-variant">
                              {new Date(u.createdAt).toLocaleDateString(
                                undefined,
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )}
                            </p>
                          </td>
                          <td className="px-lg py-md text-end">
                            {u.isActive ? (
                              <button
                                type="button"
                                className="rounded border border-outline px-md py-xs text-label-sm text-on-surface-variant transition-all hover:border-error hover:bg-error/10 hover:text-error"
                                onClick={() => setDisableTarget(u)}
                              >
                                {t("disable")}
                              </button>
                            ) : (
                              <span className="text-[11px] text-on-surface-variant/50">
                                {t("restricted")}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {!showEmpty && (
              <div className="flex items-center justify-between border-t border-outline-variant bg-surface-container-high/50 p-md">
                <p className="text-label-sm text-on-surface-variant">
                  {t("showingCount", {
                    filtered: filtered.length,
                    total: users.length,
                  })}
                </p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Disable confirm modal */}
      {disableTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 p-lg backdrop-blur-sm">
          <div
            className="w-full max-w-md rounded-xl border border-outline-variant bg-surface-container p-lg shadow-xl"
            role="dialog"
            aria-labelledby="disable-dialog-title"
            aria-modal="true"
          >
            <h5
              id="disable-dialog-title"
              className="text-headline-md font-semibold text-on-surface"
            >
              {t("disableTitle", { name: disableTarget.name })}
            </h5>
            <p className="mt-md text-body-md text-on-surface-variant">
              {t("disableDesc")}
            </p>
            <div className="mt-xl flex gap-md">
              <button
                type="button"
                className="flex-1 rounded bg-surface-variant py-md font-label-md text-on-surface transition-colors hover:bg-surface-container-highest"
                onClick={() => setDisableTarget(null)}
                disabled={disabling}
              >
                {tc("cancel")}
              </button>
              <button
                type="button"
                className="flex-1 rounded bg-error py-md font-label-md text-on-error transition-all hover:opacity-90 disabled:opacity-60"
                onClick={confirmDisable}
                disabled={disabling}
              >
                {disabling ? t("disabling") : t("disableAccount")}
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
