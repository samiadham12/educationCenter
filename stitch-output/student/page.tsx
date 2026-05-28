"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MaterialIcon } from "../components/MaterialIcon";
import { api } from "../lib/api";

type Lecture = {
  _id: string;
  title: string;
  hasAccess: boolean;
  description?: string;
};

type Section = {
  _id: string;
  name: string;
  order: number;
  lectures: Lecture[];
};

type Subject = {
  _id: string;
  name: string;
  sections: Section[];
};

type Term = {
  _id: string;
  name: string;
  order: number;
  subjects: Subject[];
};

type Year = {
  _id: string;
  name: string;
  order: number;
  terms: Term[];
};

type FlatLecture = {
  lecture: Lecture;
  path: string;
  yearId: string;
  termId: string;
};

const STORAGE_KEY = "student-browser-expanded";

type ExpandedState = {
  years: string[];
  terms: string[];
};

function loadExpanded(): ExpandedState {
  if (typeof window === "undefined") return { years: [], terms: [] };
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { years: [], terms: [] };
    return JSON.parse(raw) as ExpandedState;
  } catch {
    return { years: [], terms: [] };
  }
}

function saveExpanded(state: ExpandedState) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function flattenLectures(tree: Year[]): FlatLecture[] {
  const out: FlatLecture[] = [];
  for (const year of tree) {
    for (const term of year.terms) {
      for (const subject of term.subjects) {
        for (const section of subject.sections) {
          for (const lecture of section.lectures) {
            out.push({
              lecture,
              path: `${year.name} › ${term.name} › ${subject.name} › ${section.name}`,
              yearId: year._id,
              termId: term._id,
            });
          }
        }
      }
    }
  }
  return out;
}

function countLectures(tree: Year[]) {
  let total = 0;
  let accessible = 0;
  for (const flat of flattenLectures(tree)) {
    total++;
    if (flat.lecture.hasAccess) accessible++;
  }
  return { total, accessible };
}

function termHasNoAccess(term: Term): boolean {
  let any = false;
  let anyAccess = false;
  for (const subject of term.subjects) {
    for (const section of subject.sections) {
      for (const lecture of section.lectures) {
        any = true;
        if (lecture.hasAccess) anyAccess = true;
      }
    }
  }
  return any && !anyAccess;
}

function LectureRow({
  lecture,
  onOpen,
}: {
  lecture: Lecture;
  onOpen: (id: string) => void;
}) {
  if (lecture.hasAccess) {
    return (
      <div className="group flex items-center justify-between rounded-lg p-sm transition-colors hover:bg-emerald-500/10">
        <div className="flex min-w-0 items-center gap-sm">
          <MaterialIcon icon="play_circle" className="shrink-0 text-emerald-400" />
          <span className="truncate text-body-sm text-slate-200">
            {lecture.title}
          </span>
        </div>
        <button
          type="button"
          className="shrink-0 rounded bg-emerald-600 px-3 py-1 text-label-sm text-white transition-colors hover:bg-emerald-500"
          onClick={() => onOpen(lecture._id)}
        >
          Open
        </button>
      </div>
    );
  }

  return (
    <div
      className="flex cursor-not-allowed items-center justify-between rounded-lg p-sm opacity-50"
      title="Subscribe or enter a code to unlock"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-sm">
          <MaterialIcon icon="lock" className="shrink-0 text-slate-500" />
          <span className="truncate text-body-sm text-slate-400">
            {lecture.title}
          </span>
        </div>
        <span className="ml-8 text-[10px] text-slate-500">
          Subscribe or enter a code to unlock
        </span>
      </div>
      <span className="shrink-0 rounded bg-slate-700 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-400">
        Locked
      </span>
    </div>
  );
}

export default function StudentContentBrowserPage() {
  const router = useRouter();
  const [tree, setTree] = useState<Year[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set());
  const [expandedTerms, setExpandedTerms] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api<{ tree: Year[] }>("/api/student/content-tree");
      setTree(data.tree);
      const saved = loadExpanded();
      if (saved.years.length === 0 && data.tree[0]) {
        setExpandedYears(new Set([data.tree[0]._id]));
        if (data.tree[0].terms[0]) {
          setExpandedTerms(new Set([data.tree[0].terms[0]._id]));
        }
      } else {
        setExpandedYears(new Set(saved.years));
        setExpandedTerms(new Set(saved.terms));
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to load content",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (loading) return;
    saveExpanded({
      years: [...expandedYears],
      terms: [...expandedTerms],
    });
  }, [expandedYears, expandedTerms, loading]);

  const stats = useMemo(() => countLectures(tree), [tree]);

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return flattenLectures(tree).filter((f) =>
      f.lecture.title.toLowerCase().includes(q),
    );
  }, [tree, search]);

  const toggleYear = (id: string) => {
    setExpandedYears((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleTerm = (id: string) => {
    setExpandedTerms((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openLecture = (id: string) => {
    router.push(`/student/watch/${id}`);
  };

  const progressPct =
    stats.total > 0 ? Math.round((stats.accessible / stats.total) * 100) : 0;

  return (
    <div className="space-y-lg">
      <section>
        <h2 className="text-headline-xl font-bold text-slate-100">
          Browse Content
        </h2>
        <p className="mt-sm max-w-2xl text-body-lg text-slate-400">
          Navigate your academic journey by year, term, and subject to access
          lectures you have unlocked.
        </p>
        {stats.total > 0 && (
          <div className="mt-md flex items-center gap-sm">
            <span className="text-label-sm text-slate-500">
              {stats.accessible} of {stats.total} lectures available
            </span>
            <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full bg-emerald-500 transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="text-label-sm text-emerald-400">{progressPct}%</span>
          </div>
        )}
      </section>

      <div className="relative max-w-md">
        <MaterialIcon
          icon="search"
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
        />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search lectures..."
          className="w-full rounded-lg border border-slate-700 bg-slate-800/80 py-2 pl-10 pr-4 text-body-sm text-slate-200 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
        />
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-950/40 p-md text-body-sm text-red-300">
          {error}
          <button
            type="button"
            className="ml-md text-emerald-400 underline"
            onClick={load}
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="animate-pulse space-y-md">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-slate-800" />
          ))}
        </div>
      ) : tree.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-slate-700 bg-slate-800/50 py-xl text-center">
          <MaterialIcon icon="school" className="mb-md text-5xl text-slate-600" />
          <h3 className="text-headline-md font-semibold text-slate-200">
            No content available yet
          </h3>
          <p className="mt-sm max-w-sm text-body-sm text-slate-500">
            Check back later or enter a lecture code from your instructor.
          </p>
          <Link
            href="/student/code"
            className="mt-md text-label-md text-emerald-400 hover:underline"
          >
            Enter a lecture code
          </Link>
        </div>
      ) : search.trim() ? (
        <div className="space-y-md">
          <p className="text-label-sm text-slate-500">
            {searchResults.length} result(s) for &quot;{search}&quot;
          </p>
          {searchResults.length === 0 ? (
            <p className="text-body-sm text-slate-500">No lectures match.</p>
          ) : (
            <div className="space-y-sm rounded-xl border border-slate-700 bg-slate-800/60 p-md">
              {searchResults.map((f) => (
                <div key={f.lecture._id}>
                  <p className="mb-xs text-[10px] text-slate-500">{f.path}</p>
                  <LectureRow lecture={f.lecture} onOpen={openLecture} />
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-lg">
          {tree.map((year) => {
            const yearOpen = expandedYears.has(year._id);
            return (
              <div
                key={year._id}
                className="overflow-hidden rounded-xl border border-slate-700 bg-slate-800/60"
              >
                <button
                  type="button"
                  className="flex w-full items-center justify-between p-lg text-left transition-colors hover:bg-slate-700/50"
                  onClick={() => toggleYear(year._id)}
                  aria-expanded={yearOpen}
                >
                  <div className="flex items-center gap-md">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                      <MaterialIcon icon="history_edu" className="text-[32px]" />
                    </div>
                    <div>
                      <h3 className="text-headline-md font-semibold text-slate-100">
                        {year.name}
                      </h3>
                      <p className="text-body-sm text-slate-500">
                        {year.terms.length} term(s)
                      </p>
                    </div>
                  </div>
                  <MaterialIcon
                    icon="expand_more"
                    className={`text-slate-400 transition-transform ${yearOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {yearOpen && (
                  <div className="space-y-md border-t border-slate-700 p-lg pt-0">
                    {year.terms.map((term) => {
                      const termOpen = expandedTerms.has(term._id);
                      const lectureCount = term.subjects.reduce(
                        (n, s) =>
                          n +
                          s.sections.reduce(
                            (m, sec) => m + sec.lectures.length,
                            0,
                          ),
                        0,
                      );

                      return (
                        <div
                          key={term._id}
                          className="border-t border-slate-700/80 first:border-t-0"
                        >
                          <button
                            type="button"
                            className="flex w-full items-center gap-sm py-md text-left transition-colors hover:text-emerald-400"
                            onClick={() => toggleTerm(term._id)}
                            aria-expanded={termOpen}
                          >
                            <MaterialIcon
                              icon="chevron_right"
                              className={`text-slate-500 transition-transform ${termOpen ? "rotate-90" : ""}`}
                            />
                            <h4 className="text-label-md uppercase tracking-wider text-slate-300">
                              {term.name}
                            </h4>
                            <span className="text-label-sm text-slate-500">
                              ({lectureCount} lectures)
                            </span>
                          </button>

                          {termOpen && (
                            <div className="space-y-lg pb-md">
                              {termHasNoAccess(term) && (
                                <div className="flex flex-col gap-sm rounded-lg border border-amber-500/30 bg-amber-950/30 p-md sm:flex-row sm:items-center sm:justify-between">
                                  <p className="text-body-sm text-amber-200/90">
                                    No lectures unlocked in this term yet.
                                    Enter a code or activate a subscription.
                                  </p>
                                  <Link
                                    href="/student/code"
                                    className="shrink-0 rounded-lg bg-emerald-600 px-md py-sm text-label-md text-white hover:bg-emerald-500"
                                  >
                                    Enter Code
                                  </Link>
                                </div>
                              )}

                              <div className="grid grid-cols-1 gap-lg md:grid-cols-2 xl:grid-cols-3">
                                {term.subjects.map((subject) => (
                                  <div
                                    key={subject._id}
                                    className="glass-card flex flex-col gap-md rounded-xl p-lg"
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex h-10 w-10 items-center justify-center rounded bg-emerald-600 text-white">
                                        <MaterialIcon icon="menu_book" />
                                      </div>
                                    </div>
                                    <div>
                                      <h5 className="text-headline-md font-semibold text-slate-100">
                                        {subject.name}
                                      </h5>
                                    </div>

                                    <div className="mt-auto space-y-md">
                                      {subject.sections.length === 0 ? (
                                        <p className="text-body-sm text-slate-500">
                                          No sections yet.
                                        </p>
                                      ) : (
                                        subject.sections.map((section) => (
                                          <div
                                            key={section._id}
                                            className="rounded-lg border border-slate-600 bg-slate-900/50 p-md"
                                          >
                                            <div className="mb-sm flex items-center justify-between">
                                              <span className="text-label-md text-emerald-400">
                                                {section.name}
                                              </span>
                                              <span className="text-label-sm text-slate-500">
                                                {section.lectures.length}{" "}
                                                lecture(s)
                                              </span>
                                            </div>
                                            <div className="space-y-xs">
                                              {section.lectures.length === 0 ? (
                                                <p className="text-body-sm text-slate-600">
                                                  No lectures published.
                                                </p>
                                              ) : (
                                                section.lectures.map(
                                                  (lecture) => (
                                                    <LectureRow
                                                      key={lecture._id}
                                                      lecture={lecture}
                                                      onOpen={openLecture}
                                                    />
                                                  ),
                                                )
                                              )}
                                            </div>
                                          </div>
                                        ))
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {term.subjects.length === 0 && (
                                <p className="text-body-sm text-slate-500">
                                  No subjects in this term.
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
