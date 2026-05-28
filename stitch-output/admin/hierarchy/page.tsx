"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { MaterialIcon } from "../../components/MaterialIcon";
import { api } from "../../lib/api";

type Year = {
  _id: string;
  name: string;
  order: number;
  isActive: boolean;
};

type Term = {
  _id: string;
  name: string;
  order: number;
  isActive: boolean;
  academicYearId: string;
};

type Subject = {
  _id: string;
  name: string;
  sectionCount: 2 | 3;
  isActive: boolean;
  termId: string;
};

type Section = {
  _id: string;
  name: string;
  order: number;
  isActive: boolean;
  subjectId: string;
};

type Lecture = {
  _id: string;
  title: string;
  description?: string;
  isPublished: boolean;
  sectionId: string;
  subjectId: string;
  termId: string;
  academicYearId: string;
};

type LectureRow = { lecture: Lecture; code?: string };

type TermBranch = {
  term: Term;
  subjects: Array<{
    subject: Subject;
    sections: Array<{ section: Section; lectures: LectureRow[] }>;
  }>;
};

type YearBranch = { year: Year; terms: TermBranch[] };

type Selected =
  | { type: "year"; year: Year; path: string[] }
  | { type: "term"; term: Term; year: Year; path: string[] }
  | { type: "subject"; subject: Subject; term: Term; year: Year; path: string[] }
  | { type: "section"; section: Section; subject: Subject; term: Term; year: Year; path: string[] }
  | {
      type: "lecture";
      row: LectureRow;
      section: Section;
      subject: Subject;
      term: Term;
      year: Year;
      path: string[];
    };

type ModalKind = "year" | "term" | "subject" | "lecture" | null;

const inputClass =
  "w-full rounded-lg border border-outline-variant bg-background p-md text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary";

const btnPrimary =
  "rounded-lg bg-primary px-xl py-sm font-bold text-on-primary shadow-lg shadow-primary/20 transition-colors hover:bg-primary-container";

const btnDanger =
  "flex items-center gap-sm rounded-lg bg-error-container px-lg py-sm text-on-error-container transition-opacity hover:opacity-90";

async function fetchLecturesWithCodes(
  sectionId: string,
): Promise<LectureRow[]> {
  const data = await api<{
    lectures: Lecture[];
    codes: Array<{ code: string; lectureId: string }>;
  }>(`/api/lectures?sectionId=${sectionId}`);
  const codeMap = new Map(
    data.codes.map((c) => [String(c.lectureId), c.code]),
  );
  return data.lectures.map((lecture) => ({
    lecture,
    code: codeMap.get(String(lecture._id)),
  }));
}

export default function AcademicHierarchyPage() {
  const t = useTranslations("admin.hierarchy");
  const tc = useTranslations("common");

  const [tree, setTree] = useState<YearBranch[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<Selected | null>(null);
  const [modal, setModal] = useState<ModalKind>(null);
  const [modalParent, setModalParent] = useState<{
    yearId?: string;
    termId?: string;
    subjectId?: string;
    sectionId?: string;
    academicYearId?: string;
  }>({});
  const [deleteTarget, setDeleteTarget] = useState<Selected | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [newLectureCode, setNewLectureCode] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    icon: string;
    error?: boolean;
  } | null>(null);

  const [editName, setEditName] = useState("");
  const [editOrder, setEditOrder] = useState(1);
  const [editActive, setEditActive] = useState(true);
  const [editPublished, setEditPublished] = useState(false);
  const [editDescription, setEditDescription] = useState("");
  const [lectureCode, setLectureCode] = useState("");

  const showToast = useCallback(
    (message: string, icon: string, error = false) => {
      setToast({ message, icon, error });
    },
    [],
  );

  const loadTree = useCallback(async () => {
    setLoading(true);
    try {
      const { academicYears } = await api<{ academicYears: Year[] }>(
        "/api/academic-years",
      );
      const branches: YearBranch[] = [];

      for (const year of academicYears.sort((a, b) => a.order - b.order)) {
        const { terms } = await api<{ terms: Term[] }>(
          `/api/terms?academicYearId=${year._id}`,
        );
        const termBranches: TermBranch[] = [];

        for (const term of terms.sort((a, b) => a.order - b.order)) {
          const { subjects } = await api<{ subjects: Subject[] }>(
            `/api/subjects?termId=${term._id}`,
          );
          const subjectBranches = [];

          for (const subject of subjects) {
            const { sections } = await api<{ sections: Section[] }>(
              `/api/sections?subjectId=${subject._id}`,
            );
            const sectionBranches = [];

            for (const section of sections.sort((a, b) => a.order - b.order)) {
              const lectures = await fetchLecturesWithCodes(section._id);
              sectionBranches.push({ section, lectures });
            }
            subjectBranches.push({ subject, sections: sectionBranches });
          }
          termBranches.push({ term, subjects: subjectBranches });
        }
        branches.push({ year, terms: termBranches });
      }

      setTree(branches);
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
    loadTree();
  }, [loadTree]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!selected) {
      setEditName("");
      return;
    }
    switch (selected.type) {
      case "year":
        setEditName(selected.year.name);
        setEditOrder(selected.year.order);
        setEditActive(selected.year.isActive);
        break;
      case "term":
        setEditName(selected.term.name);
        setEditOrder(selected.term.order);
        setEditActive(selected.term.isActive);
        break;
      case "subject":
        setEditName(selected.subject.name);
        setEditActive(selected.subject.isActive);
        break;
      case "section":
        setEditName(selected.section.name);
        setEditActive(selected.section.isActive);
        break;
      case "lecture":
        setEditName(selected.row.lecture.title);
        setEditDescription(selected.row.lecture.description ?? "");
        setEditPublished(selected.row.lecture.isPublished);
        setLectureCode(selected.row.code ?? "");
        break;
    }
  }, [selected]);

  const toggleExpand = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const openCreate = (
    kind: ModalKind,
    parent: typeof modalParent = {},
  ) => {
    setModal(kind);
    setModalParent(parent);
  };

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      showToast(t("codeCopied"), "content_copy");
    } catch {
      showToast(t("copyFailed"), "error", true);
    }
  }

  function inferLocalePrefixFromPathname(pathname: string): string {
    const seg = pathname.split("/").filter(Boolean)[0];
    if (seg && /^[a-z]{2}$/i.test(seg)) return `/${seg}`;
    return "";
  }

  async function copyOneTimeLink(lectureId: string) {
    try {
      const res = await api<{ token: string }>("/api/one-time-lecture-links", {
        method: "POST",
        body: JSON.stringify({ lectureId }),
      });
      const origin = window.location.origin;
      const localePrefix = inferLocalePrefixFromPathname(window.location.pathname);
      const url = `${origin}${localePrefix}/student/one-time/${encodeURIComponent(res.token)}`;
      await navigator.clipboard.writeText(url);
      showToast("Link copied", "link");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to create link", "error", true);
    }
  }

  async function saveSelected() {
    if (!selected) return;
    setSaving(true);
    try {
      switch (selected.type) {
        case "year":
          await api(`/api/academic-years/${selected.year._id}`, {
            method: "PUT",
            body: JSON.stringify({
              name: editName,
              order: editOrder,
              isActive: editActive,
            }),
          });
          break;
        case "term":
          await api(`/api/terms/${selected.term._id}`, {
            method: "PUT",
            body: JSON.stringify({
              name: editName,
              order: editOrder,
              isActive: editActive,
            }),
          });
          break;
        case "subject":
          await api(`/api/subjects/${selected.subject._id}`, {
            method: "PUT",
            body: JSON.stringify({
              name: editName,
              isActive: editActive,
            }),
          });
          break;
        case "lecture":
          await api(`/api/lectures/${selected.row.lecture._id}`, {
            method: "PUT",
            body: JSON.stringify({
              title: editName,
              description: editDescription,
              isPublished: editPublished,
            }),
          });
          break;
        default:
          break;
      }
      showToast(t("saved"), "check_circle");
      await loadTree();
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : t("saveFailed"),
        "error",
        true,
      );
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const id =
        deleteTarget.type === "lecture"
          ? deleteTarget.row.lecture._id
          : deleteTarget.type === "year"
            ? deleteTarget.year._id
            : deleteTarget.type === "term"
              ? deleteTarget.term._id
              : deleteTarget.type === "subject"
                ? deleteTarget.subject._id
                : "";

      const path =
        deleteTarget.type === "year"
          ? `/api/academic-years/${id}`
          : deleteTarget.type === "term"
            ? `/api/terms/${id}`
            : deleteTarget.type === "subject"
              ? `/api/subjects/${id}`
              : `/api/lectures/${id}`;

      await api(path, { method: "DELETE" });
      showToast(t("deleted"), "delete");
      setDeleteTarget(null);
      setSelected(null);
      await loadTree();
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : t("deleteFailed"),
        "error",
        true,
      );
    } finally {
      setDeleting(false);
    }
  }

  async function regenerateCode(lectureId: string) {
    setRegenerating(true);
    try {
      const res = await api<{ lectureCode: { code: string } }>(
        "/api/lecture-codes/regenerate",
        {
          method: "POST",
          body: JSON.stringify({ lectureId }),
        },
      );
      const code = res.lectureCode.code;
      setLectureCode(code);
      setNewLectureCode(code);
      showToast(t("codeRegenerated"), "autorenew");
      await loadTree();
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : t("regenerateFailed"),
        "error",
        true,
      );
    } finally {
      setRegenerating(false);
    }
  }

  async function onModalSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setSaving(true);
    try {
      if (modal === "year") {
        await api("/api/academic-years", {
          method: "POST",
          body: JSON.stringify({
            name: fd.get("name"),
            order: Number(fd.get("order")),
          }),
        });
      } else if (modal === "term" && modalParent.yearId) {
        await api("/api/terms", {
          method: "POST",
          body: JSON.stringify({
            name: fd.get("name"),
            academicYearId: modalParent.yearId,
            order: Number(fd.get("order")),
          }),
        });
      } else if (modal === "subject" && modalParent.termId) {
        await api("/api/subjects", {
          method: "POST",
          body: JSON.stringify({
            name: fd.get("name"),
            termId: modalParent.termId,
            sectionCount: Number(fd.get("sectionCount")),
          }),
        });
      } else if (
        modal === "lecture" &&
        modalParent.sectionId &&
        modalParent.subjectId &&
        modalParent.termId &&
        modalParent.academicYearId
      ) {
        const res = await api<{
          lecture: Lecture;
          code?: { code: string };
        }>("/api/lectures", {
          method: "POST",
          body: JSON.stringify({
            title: fd.get("title"),
            description: fd.get("description") || undefined,
            sectionId: modalParent.sectionId,
            subjectId: modalParent.subjectId,
            termId: modalParent.termId,
            academicYearId: modalParent.academicYearId,
            isPublished: fd.get("isPublished") === "on",
          }),
        });
        let code = res.code?.code;
        if (!code) {
          const codes = await api<{
            codes: Array<{ code: string }>;
          }>(`/api/lecture-codes/${res.lecture._id}`);
          code = codes.codes[0]?.code;
        }
        if (code) {
          setNewLectureCode(code);
          showToast(t("lectureCreated"), "key");
        } else {
          showToast(t("lectureCreated"), "check_circle");
        }
      }
      setModal(null);
      showToast(t("created"), "add_circle");
      await loadTree();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : t("createFailed"),
        "error",
        true,
      );
    } finally {
      setSaving(false);
    }
  }

  const breadcrumb =
    selected?.path.join(" › ") ?? t("selectFromTree");

  function renderTree() {
    if (loading) {
      return (
        <p className="p-md text-body-sm text-on-surface-variant">
          Loading hierarchy…
        </p>
      );
    }
    if (tree.length === 0) {
      return (
        <p className="p-md text-body-sm text-on-surface-variant">
          No academic years yet. Add a year to begin.
        </p>
      );
    }

    return tree.map(({ year, terms }) => {
      const yKey = `year-${year._id}`;
      const yOpen = expanded[yKey] ?? true;
      return (
        <div key={year._id} className="mb-sm">
          <button
            type="button"
            className={`group flex w-full items-center justify-between rounded-lg p-sm transition-all hover:bg-surface-variant ${
              selected?.type === "year" && selected.year._id === year._id
                ? "border-l-2 border-primary bg-primary/10"
                : ""
            }`}
            onClick={() => {
              toggleExpand(yKey);
              setSelected({
                type: "year",
                year,
                path: [year.name],
              });
            }}
          >
            <span className="flex items-center gap-md">
              <MaterialIcon
                icon={yOpen ? "folder_open" : "folder"}
                className="text-tertiary"
              />
              <span className="text-body-md font-medium">{year.name}</span>
            </span>
            <MaterialIcon
              icon={yOpen ? "expand_more" : "chevron_right"}
              className="text-on-surface-variant opacity-0 group-hover:opacity-100"
            />
          </button>

          {yOpen &&
            terms.map(({ term, subjects }) => {
              const tKey = `term-${term._id}`;
              const tOpen = expanded[tKey] ?? false;
              return (
                <div
                  key={term._id}
                  className="ml-xl mt-xs flex flex-col gap-xs border-l-2 border-outline-variant/30 pl-md"
                >
                  <button
                    type="button"
                    className={`group flex w-full items-center justify-between rounded-lg p-sm hover:bg-surface-variant ${
                      selected?.type === "term" &&
                      selected.term._id === term._id
                        ? "border-l-2 border-primary bg-primary/10"
                        : ""
                    }`}
                    onClick={() => {
                      toggleExpand(tKey);
                      setSelected({
                        type: "term",
                        term,
                        year,
                        path: [year.name, term.name],
                      });
                    }}
                  >
                    <span className="flex items-center gap-md">
                      <MaterialIcon
                        icon="folder"
                        className="text-tertiary-fixed-dim"
                      />
                      <span className="text-body-md">{term.name}</span>
                    </span>
                    <MaterialIcon icon={tOpen ? "expand_more" : "chevron_right"} />
                  </button>

                  {tOpen &&
                    subjects.map(({ subject, sections }) => {
                      const sKey = `subject-${subject._id}`;
                      const sOpen = expanded[sKey] ?? false;
                      return (
                        <div
                          key={subject._id}
                          className="ml-lg flex flex-col gap-xs pl-md"
                        >
                          <button
                            type="button"
                            className={`group flex w-full items-center justify-between rounded-lg p-sm hover:bg-surface-variant ${
                              selected?.type === "subject" &&
                              selected.subject._id === subject._id
                                ? "bg-primary/10"
                                : ""
                            }`}
                            onClick={() => {
                              toggleExpand(sKey);
                              setSelected({
                                type: "subject",
                                subject,
                                term,
                                year,
                                path: [year.name, term.name, subject.name],
                              });
                            }}
                          >
                            <span className="flex items-center gap-md">
                              <MaterialIcon icon="book" className="text-secondary" />
                              <span className="text-body-md">{subject.name}</span>
                            </span>
                            <MaterialIcon icon={sOpen ? "expand_more" : "chevron_right"} />
                          </button>

                          {sOpen &&
                            sections.map(({ section, lectures }) => {
                              const secKey = `section-${section._id}`;
                              const secOpen = expanded[secKey] ?? false;
                              return (
                                <div
                                  key={section._id}
                                  className="ml-lg flex flex-col gap-xs pl-md"
                                >
                                  <button
                                    type="button"
                                    className={`group flex w-full items-center justify-between rounded-lg p-sm hover:bg-surface-variant ${
                                      selected?.type === "section" &&
                                      selected.section._id === section._id
                                        ? "bg-primary/10"
                                        : ""
                                    }`}
                                    onClick={() => {
                                      toggleExpand(secKey);
                                      setSelected({
                                        type: "section",
                                        section,
                                        subject,
                                        term,
                                        year,
                                        path: [
                                          year.name,
                                          term.name,
                                          subject.name,
                                          section.name,
                                        ],
                                      });
                                    }}
                                  >
                                    <span className="flex items-center gap-md">
                                      <MaterialIcon
                                        icon="assignment"
                                        className="text-primary-fixed"
                                      />
                                      <span className="text-body-sm">
                                        {section.name}
                                      </span>
                                    </span>
                                    <MaterialIcon
                                      icon={secOpen ? "expand_more" : "chevron_right"}
                                    />
                                  </button>

                                  {secOpen &&
                                    lectures.map((row) => (
                                      <button
                                        key={row.lecture._id}
                                        type="button"
                                        className={`ml-lg flex w-full items-center justify-between rounded-lg p-sm pl-md hover:bg-surface-variant ${
                                          selected?.type === "lecture" &&
                                          selected.row.lecture._id ===
                                            row.lecture._id
                                            ? "bg-primary/10"
                                            : ""
                                        }`}
                                        onClick={() =>
                                          setSelected({
                                            type: "lecture",
                                            row,
                                            section,
                                            subject,
                                            term,
                                            year,
                                            path: [
                                              year.name,
                                              term.name,
                                              subject.name,
                                              section.name,
                                              row.lecture.title,
                                            ],
                                          })
                                        }
                                      >
                                        <span className="flex items-center gap-md">
                                          <MaterialIcon
                                            icon="play_circle"
                                            className="text-on-surface-variant"
                                          />
                                          <span className="text-body-sm text-on-surface-variant">
                                            {row.lecture.title}
                                          </span>
                                        </span>
                                      </button>
                                    ))}
                                </div>
                              );
                            })}
                        </div>
                      );
                    })}
                </div>
              );
            })}
        </div>
      );
    });
  }

  return (
    <div className="space-y-lg">
      <section>
        <h1 className="text-headline-lg font-semibold text-on-surface">
          {t("title")}
        </h1>
        <p className="text-body-md text-on-surface-variant">
          {t("subtitle")}
        </p>
      </section>

      <div className="flex flex-col gap-lg lg:flex-row">
        {/* Tree */}
        <section className="flex w-full flex-col overflow-hidden rounded-xl border border-outline-variant bg-surface-container lg:max-w-md lg:min-w-[320px] lg:flex-1">
          <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container-high p-md">
            <h3 className="text-label-md uppercase tracking-widest text-on-surface-variant">
              {t("treeTitle")}
            </h3>
            <button
              type="button"
              className="flex items-center gap-xs text-label-sm text-primary-fixed transition-colors hover:text-primary"
              onClick={() => openCreate("year")}
            >
              <MaterialIcon icon="add" className="text-sm" />
              {t("addYear")}
            </button>
          </div>
          <div className="max-h-[70vh] flex-1 overflow-y-auto p-sm">
            {renderTree()}
          </div>
        </section>

        {/* Detail panel */}
        <section className="flex min-w-0 flex-1 flex-col gap-lg">
          <div className="flex items-center gap-sm rounded-xl border border-outline-variant bg-surface-container px-lg py-md">
            <span className="text-label-md text-on-surface-variant">Hierarchy</span>
            <MaterialIcon icon="chevron_right" className="text-sm text-outline" />
            <span className="text-label-md font-medium text-primary">
              {breadcrumb}
            </span>
          </div>

          <div className="min-h-[400px] flex-1 overflow-y-auto rounded-xl border border-outline-variant bg-surface-container p-xl">
            {!selected ? (
              <div className="flex h-full flex-col items-center justify-center text-center opacity-50">
                <MaterialIcon icon="account_tree" className="mb-md text-6xl" />
                <h3 className="text-headline-md font-semibold">
                  Select an item to manage
                </h3>
                <p className="text-body-md text-on-surface-variant">
                  Choose a level from the tree to view details and settings.
                </p>
              </div>
            ) : (
              <div className="space-y-lg">
                <div className="flex flex-wrap items-start justify-between gap-md">
                  <div>
                    <h2 className="text-headline-lg font-semibold text-on-surface">
                      {selected.type === "lecture"
                        ? selected.row.lecture.title
                        : selected.type === "year"
                          ? selected.year.name
                          : selected.type === "term"
                            ? selected.term.name
                            : selected.type === "subject"
                              ? selected.subject.name
                              : selected.section.name}{" "}
                      Details
                    </h2>
                    <p className="text-body-md capitalize text-on-surface-variant">
                      Level: {selected.type}
                    </p>
                  </div>
                  {selected.type !== "section" && (
                    <div className="flex gap-md">
                      <button
                        type="button"
                        className={btnDanger}
                        onClick={() => setDeleteTarget(selected)}
                      >
                        <MaterialIcon icon="delete" className="text-md" />
                        {t("delete")}
                      </button>
                      <button
                        type="button"
                        className={btnPrimary}
                        disabled={saving}
                        onClick={saveSelected}
                      >
                        {saving ? t("saving") : t("saveChanges")}
                      </button>
                    </div>
                  )}
                </div>

                {selected.type === "year" && (
                  <div className="grid grid-cols-1 gap-lg md:grid-cols-2">
                    <div className="space-y-sm">
                      <label className="text-label-md text-primary">
                        Display Name
                      </label>
                      <input
                        className={inputClass}
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-sm">
                      <label className="text-label-md text-primary">Order</label>
                      <select
                        className={inputClass}
                        value={editOrder}
                        onChange={(e) => setEditOrder(Number(e.target.value))}
                      >
                        {[1, 2, 3, 4].map((n) => (
                          <option key={n} value={n}>
                            Year {n}
                          </option>
                        ))}
                      </select>
                    </div>
                    <ActiveToggle
                      checked={editActive}
                      onChange={setEditActive}
                    />
                    <div className="md:col-span-2">
                      <button
                        type="button"
                        className="flex items-center gap-sm text-primary"
                        onClick={() =>
                          openCreate("term", { yearId: selected.year._id })
                        }
                      >
                        <MaterialIcon icon="add_circle" />
                        Add Term
                      </button>
                    </div>
                  </div>
                )}

                {selected.type === "term" && (
                  <div className="grid grid-cols-1 gap-lg md:grid-cols-2">
                    <div className="space-y-sm">
                      <label className="text-label-md text-primary">Name</label>
                      <input
                        className={inputClass}
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-sm">
                      <label className="text-label-md text-primary">Order</label>
                      <select
                        className={inputClass}
                        value={editOrder}
                        onChange={(e) => setEditOrder(Number(e.target.value))}
                      >
                        <option value={1}>Term 1</option>
                        <option value={2}>Term 2</option>
                      </select>
                    </div>
                    <ActiveToggle
                      checked={editActive}
                      onChange={setEditActive}
                    />
                    <div className="md:col-span-2">
                      <button
                        type="button"
                        className="flex items-center gap-sm text-primary"
                        onClick={() =>
                          openCreate("subject", { termId: selected.term._id })
                        }
                      >
                        <MaterialIcon icon="add_circle" />
                        Add Subject
                      </button>
                    </div>
                  </div>
                )}

                {selected.type === "subject" && (
                  <div className="space-y-lg">
                    <div className="grid grid-cols-1 gap-lg md:grid-cols-2">
                      <div className="space-y-sm">
                        <label className="text-label-md text-primary">Name</label>
                        <input
                          className={inputClass}
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                        />
                      </div>
                      <ActiveToggle
                        checked={editActive}
                        onChange={setEditActive}
                      />
                    </div>
                    <div className="rounded-xl border border-outline-variant bg-surface-container-high p-lg">
                      <p className="mb-md text-label-md text-on-surface">
                        Section Count (set at creation)
                      </p>
                      <p className="text-body-md text-on-surface-variant">
                        {selected.subject.sectionCount} sections auto-created
                        (Section A, B
                        {selected.subject.sectionCount === 3 ? ", C" : ""})
                      </p>
                    </div>
                  </div>
                )}

                {selected.type === "section" && (
                  <div className="space-y-md">
                    <p className="text-body-md text-on-surface-variant">
                      Sections are auto-created with subjects and cannot be
                      renamed via API. Add lectures below.
                    </p>
                    <button
                      type="button"
                      className={btnPrimary}
                      onClick={() =>
                        openCreate("lecture", {
                          sectionId: selected.section._id,
                          subjectId: selected.subject._id,
                          termId: selected.term._id,
                          academicYearId: selected.year._id,
                        })
                      }
                    >
                      <MaterialIcon icon="add" className="mr-sm" />
                      Add Lecture
                    </button>
                  </div>
                )}

                {selected.type === "lecture" && (
                  <div className="space-y-lg">
                    <div className="grid grid-cols-1 gap-lg md:grid-cols-2">
                      <div className="space-y-sm">
                        <label className="text-label-md text-primary">Title</label>
                        <input
                          className={inputClass}
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                        />
                      </div>
                      <PublishedToggle
                        checked={editPublished}
                        onChange={setEditPublished}
                      />
                      <div className="space-y-sm md:col-span-2">
                        <label className="text-label-md text-primary">
                          Description
                        </label>
                        <textarea
                          className={inputClass}
                          rows={3}
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="rounded-xl border border-outline-variant bg-surface-container-high p-lg">
                      <p className="mb-md text-label-md text-on-surface">
                        {t("accessCode")}
                      </p>
                      <p className="mb-md text-body-sm text-on-surface-variant">
                        {t("oneTimeCodeHint")}
                      </p>
                      <div className="flex flex-wrap items-center gap-md">
                        <code className="rounded-lg bg-background px-lg py-md font-mono text-headline-md text-primary">
                          {lectureCode || "—"}
                        </code>
                        {lectureCode && (
                          <button
                            type="button"
                            className="flex items-center gap-xs rounded-lg border border-outline-variant px-md py-sm text-label-md hover:bg-surface-variant"
                            onClick={() => copyCode(lectureCode)}
                          >
                            <MaterialIcon icon="content_copy" />
                            Copy
                          </button>
                        )}
                        {lectureCode && selected && selected.type === "lecture" && (
                          <button
                            type="button"
                            className="flex items-center gap-xs rounded-lg border border-outline-variant px-md py-sm text-label-md hover:bg-surface-variant"
                            onClick={() => copyOneTimeLink(selected.row.lecture._id)}
                          >
                            <MaterialIcon icon="link" />
                            Copy link
                          </button>
                        )}
                        <button
                          type="button"
                          className="flex items-center gap-xs rounded-lg border border-tertiary px-md py-sm text-label-md text-tertiary hover:bg-tertiary/10"
                          disabled={regenerating}
                          onClick={() => {
                            if (window.confirm(t("regenerateConfirm"))) {
                              regenerateCode(selected.row.lecture._id);
                            }
                          }}
                        >
                          <MaterialIcon icon="autorenew" />
                          {regenerating ? t("regenerating") : t("regenerate")}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>

      {newLectureCode && (
        <div className="rounded-xl border border-primary/30 bg-primary/10 p-md">
          <p className="text-label-md text-on-surface">
            New lecture access code:{" "}
            <code className="font-mono text-primary">{newLectureCode}</code>
          </p>
          <button
            type="button"
            className="mt-sm text-primary hover:underline"
            onClick={() => copyCode(newLectureCode)}
          >
            Copy code
          </button>
        </div>
      )}

      {/* Create modal */}
      {modal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-lg">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setModal(null)}
          />
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-high shadow-2xl">
            <div className="flex items-center justify-between border-b border-outline-variant p-lg">
              <h3 className="text-headline-md font-semibold">
                {t("create")}{" "}
                {modal === "year"
                  ? t("entityYear")
                  : modal === "term"
                    ? t("entityTerm")
                    : modal === "subject"
                      ? t("entitySubject")
                      : t("entityLecture")}
              </h3>
              <button
                type="button"
                className="rounded-full p-sm hover:bg-surface-variant"
                onClick={() => setModal(null)}
              >
                <MaterialIcon icon="close" />
              </button>
            </div>
            <form className="space-y-lg p-lg" onSubmit={onModalSubmit}>
              {modal === "year" && (
                <>
                  <Field label={t("fieldName")} name="name" required />
                  <div className="space-y-sm">
                    <label className="text-label-md text-primary">Order</label>
                    <select name="order" className={inputClass} defaultValue={1}>
                      {[1, 2, 3, 4].map((n) => (
                        <option key={n} value={n}>
                          Year {n}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
              {modal === "term" && (
                <>
                  <Field label={t("fieldName")} name="name" required />
                  <div className="space-y-sm">
                    <label className="text-label-md text-primary">Order</label>
                    <select name="order" className={inputClass} defaultValue={1}>
                      <option value={1}>Term 1</option>
                      <option value={2}>Term 2</option>
                    </select>
                  </div>
                </>
              )}
              {modal === "subject" && (
                <>
                  <Field label={t("fieldSubjectName")} name="name" required />
                  <div className="space-y-sm">
                    <p className="text-label-md text-on-surface">Section Count</p>
                    <div className="flex gap-xl">
                      <label className="flex cursor-pointer items-center gap-md">
                        <input
                          type="radio"
                          name="sectionCount"
                          value={2}
                          defaultChecked
                        />
                        <span className="text-body-md">2 Sections</span>
                      </label>
                      <label className="flex cursor-pointer items-center gap-md">
                        <input type="radio" name="sectionCount" value={3} />
                        <span className="text-body-md">3 Sections</span>
                      </label>
                    </div>
                  </div>
                </>
              )}
              {modal === "lecture" && (
                <>
                  <Field label={t("fieldTitle")} name="title" required />
                  <Field label={t("fieldDescription")} name="description" />
                  <label className="flex items-center gap-md">
                    <input type="checkbox" name="isPublished" />
                    <span className="text-body-md">Publish immediately</span>
                  </label>
                </>
              )}
              <div className="flex gap-md pt-md">
                <button
                  type="button"
                  className="flex-1 rounded-lg border border-outline-variant py-md hover:bg-surface-variant"
                  onClick={() => setModal(null)}
                >
                  {tc("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-lg bg-primary py-md font-bold text-on-primary disabled:opacity-60"
                >
                  {saving ? t("creating") : t("create")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 p-lg backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-outline-variant bg-surface-container p-lg shadow-xl">
            <h5 className="text-headline-md font-semibold text-on-surface">
              Confirm deletion?
            </h5>
            <p className="mt-md text-body-md text-on-surface-variant">
              This will permanently delete this {deleteTarget.type} and may
              affect nested content. This cannot be undone.
            </p>
            <div className="mt-xl flex gap-md">
              <button
                type="button"
                className="flex-1 rounded bg-surface-variant py-md font-label-md"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                {tc("cancel")}
              </button>
              <button
                type="button"
                className="flex-1 rounded bg-error py-md font-label-md text-on-error"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? t("deleting") : t("delete")}
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

function Field({
  label,
  name,
  required,
}: {
  label: string;
  name: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-sm">
      <label className="text-label-md text-primary">{label}</label>
      <input
        name={name}
        required={required}
        className={inputClass}
        placeholder={`Enter ${label.toLowerCase()}`}
      />
    </div>
  );
}

function ActiveToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="space-y-sm">
      <label className="text-label-md text-primary">Status</label>
      <div className="flex items-center justify-between rounded-lg border border-outline-variant bg-background p-md">
        <span className="text-body-md">Active</span>
        <label className="relative inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            className="peer sr-only"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
          />
          <div className="peer h-6 w-11 rounded-full bg-surface-container-highest after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-primary peer-checked:after:translate-x-full" />
        </label>
      </div>
    </div>
  );
}

function PublishedToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="space-y-sm">
      <label className="text-label-md text-primary">Published</label>
      <div className="flex items-center justify-between rounded-lg border border-outline-variant bg-background p-md">
        <span className="text-body-md">Visible to students</span>
        <label className="relative inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            className="peer sr-only"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
          />
          <div className="peer h-6 w-11 rounded-full bg-surface-container-highest after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-primary peer-checked:after:translate-x-full" />
        </label>
      </div>
    </div>
  );
}
