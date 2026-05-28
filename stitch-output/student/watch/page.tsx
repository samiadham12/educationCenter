"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AudioPlayer } from "../../components/media/AudioPlayer";
import { PdfViewer } from "../../components/media/PdfViewer";
import { VideoPlayer } from "../../components/media/VideoPlayer";
import { MaterialIcon } from "../../components/MaterialIcon";
import { api } from "../../lib/api";

type MediaFileType = "VIDEO" | "AUDIO" | "PDF";
type TabId = MediaFileType;

type MediaItem = {
  _id: string;
  fileName: string;
  fileType: MediaFileType;
  uploadStatus: string;
  durationSeconds?: number;
};

type ContentLecture = { _id: string; title: string; hasAccess: boolean };
type ContentTree = {
  tree: Array<{
    _id: string;
    name: string;
    terms: Array<{
      _id: string;
      name: string;
      subjects: Array<{
        _id: string;
        name: string;
        sections: Array<{
          _id: string;
          name: string;
          lectures: ContentLecture[];
        }>;
      }>;
    }>;
  }>;
};

const TAB_CONFIG: Record<
  TabId,
  { label: string; icon: string; filled?: boolean }
> = {
  VIDEO: { label: "Video", icon: "play_circle", filled: true },
  AUDIO: { label: "Audio", icon: "audio_file" },
  PDF: { label: "Notes (PDF)", icon: "description" },
};

function defaultTab(types: TabId[]): TabId {
  if (types.includes("VIDEO")) return "VIDEO";
  if (types.includes("AUDIO")) return "AUDIO";
  return "PDF";
}

function findLectureTitle(tree: ContentTree["tree"], lectureId: string): string | null {
  for (const year of tree) {
    for (const term of year.terms) {
      for (const subject of term.subjects) {
        for (const section of subject.sections) {
          const lecture = section.lectures.find((l) => l._id === lectureId);
          if (lecture) return lecture.title;
        }
      }
    }
  }
  return null;
}

function shortLectureId(id: string): string {
  if (id.length <= 12) return id;
  return `${id.slice(0, 6)}…${id.slice(-4)}`;
}

export default function StudentWatchPage() {
  const { lectureId } = useParams<{ lectureId: string }>();
  const { data: session } = useSession();

  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [error, setError] = useState("");
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [lectureTitle, setLectureTitle] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("VIDEO");

  // Students should still see media that is currently PROCESSING (e.g. video transcoding),
  // otherwise the tab disappears during background reprocessing.
  const visibleMedia = useMemo(
    () =>
      media.filter(
        (m) =>
          m.uploadStatus === "READY" ||
          m.uploadStatus === "PROCESSING" ||
          m.uploadStatus === "FAILED",
      ),
    [media],
  );

  const availableTabs = useMemo(() => {
    const types = new Set<TabId>();
    for (const item of visibleMedia) {
      if (item.fileType === "VIDEO" || item.fileType === "AUDIO" || item.fileType === "PDF") {
        types.add(item.fileType);
      }
    }
    return (["VIDEO", "AUDIO", "PDF"] as TabId[]).filter((t) => types.has(t));
  }, [visibleMedia]);

  const mediaByType = useMemo(() => {
    const map: Partial<Record<TabId, MediaItem>> = {};
    for (const tab of availableTabs) {
      const item = visibleMedia.find((m) => m.fileType === tab);
      if (item) map[tab] = item;
    }
    return map;
  }, [visibleMedia, availableTabs]);

  const load = useCallback(async () => {
    if (!lectureId) return;
    setLoading(true);
    setAccessDenied(false);
    setError("");

    try {
      const [mediaRes, treeRes] = await Promise.all([
        api<{ media: MediaItem[] }>(
          `/api/media?lectureId=${encodeURIComponent(lectureId)}`,
        ),
        api<ContentTree>("/api/student/content-tree").catch(() => ({
          tree: [],
        })),
      ]);

      const ready = mediaRes.media.filter((m) => m.uploadStatus === "READY");
      const readyOrProcessing = mediaRes.media.filter(
        (m) =>
          m.uploadStatus === "READY" ||
          m.uploadStatus === "PROCESSING" ||
          m.uploadStatus === "FAILED",
      );
      const title = findLectureTitle(treeRes.tree, lectureId);

      if (title) setLectureTitle(title);

      const lecture = treeRes.tree
        .flatMap((y) => y.terms)
        .flatMap((t) => t.subjects)
        .flatMap((s) => s.sections)
        .flatMap((sec) => sec.lectures)
        .find((l) => l._id === lectureId);

      if (lecture && !lecture.hasAccess) {
        setAccessDenied(true);
        setMedia([]);
        return;
      }

      if (readyOrProcessing.length === 0) {
        setAccessDenied(true);
        setMedia(mediaRes.media);
        return;
      }

      setMedia(mediaRes.media);
      const tabs = (["VIDEO", "AUDIO", "PDF"] as TabId[]).filter((t) =>
        readyOrProcessing.some((m) => m.fileType === t),
      );
      setActiveTab(defaultTab(tabs));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load lecture";
      if (
        msg.toLowerCase().includes("access") ||
        msg.toLowerCase().includes("denied") ||
        msg.toLowerCase().includes("unauthorized") ||
        msg.toLowerCase().includes("403")
      ) {
        setAccessDenied(true);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [lectureId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (availableTabs.length > 0 && !availableTabs.includes(activeTab)) {
      setActiveTab(defaultTab(availableTabs));
    }
  }, [availableTabs, activeTab]);

  const displayTitle =
    lectureTitle ?? (lectureId ? `Lecture ${shortLectureId(lectureId)}` : "Lecture");

  const userEmail = session?.user?.email ?? "";
  const activeMedia = mediaByType[activeTab];

  if (!lectureId) {
    return (
      <p className="text-body-md text-slate-400">Invalid lecture link.</p>
    );
  }

  return (
    <div className="space-y-lg">
      <div className="flex flex-col gap-sm border-b border-outline-variant/40 pb-md sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/student"
          className="flex items-center gap-xs text-primary transition-colors hover:underline"
        >
          <MaterialIcon icon="arrow_back" className="text-[18px]" />
          <span className="text-label-md font-semibold">Back to Content</span>
        </Link>
        <h1 className="text-headline-md font-semibold text-on-surface sm:text-center">
          {displayTitle}
        </h1>
        <div className="hidden w-[140px] sm:block" aria-hidden />
      </div>

      {loading ? (
        <div className="animate-pulse space-y-md">
          <div className="h-10 rounded-lg bg-slate-800" />
          <div className="aspect-video rounded-xl bg-slate-800" />
        </div>
      ) : accessDenied ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-950/30 p-xl text-center">
          <MaterialIcon
            icon="lock"
            className="mx-auto mb-md text-5xl text-amber-400/80"
          />
          <h2 className="text-headline-md font-semibold text-slate-100">
            You do not have access to this lecture.
          </h2>
          <p className="mt-sm text-body-sm text-slate-400">
            Redeem a code or browse content you have unlocked.
          </p>
          <div className="mt-lg flex flex-wrap justify-center gap-md">
            <Link
              href="/student/code"
              className="rounded-lg bg-emerald-600 px-lg py-sm text-label-md font-semibold text-white hover:bg-emerald-500"
            >
              Enter a code
            </Link>
            <Link
              href="/student"
              className="rounded-lg border border-slate-600 px-lg py-sm text-label-md text-slate-200 hover:border-emerald-500/50 hover:text-emerald-400"
            >
              Browse content
            </Link>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-950/40 p-lg text-center">
          <p className="text-body-md text-red-300">{error}</p>
          <button
            type="button"
            onClick={load}
            className="mt-md text-label-md text-emerald-400 underline"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          {availableTabs.length > 1 && (
            <div className="flex items-center gap-lg border-b border-outline-variant/30">
              {availableTabs.map((tab) => {
                const cfg = TAB_CONFIG[tab];
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`flex items-center gap-sm border-b-2 pb-md text-label-md font-semibold transition-colors ${
                      isActive
                        ? "border-primary text-primary"
                        : "border-transparent text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    <MaterialIcon
                      icon={cfg.icon}
                      filled={isActive && cfg.filled}
                      className="text-[20px]"
                    />
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          )}

          {activeMedia && lectureId && (
            <div className="w-full">
              {activeTab === "VIDEO" && activeMedia.uploadStatus === "FAILED" && (
                <div className="rounded-xl border border-red-500/30 bg-red-950/40 p-xl text-center">
                  <MaterialIcon
                    icon="error_outline"
                    className="mx-auto mb-md text-5xl text-red-400"
                  />
                  <h2 className="text-headline-md font-semibold text-slate-100">
                    Video is not available
                  </h2>
                  <p className="mt-sm text-body-sm text-slate-400">
                    Processing failed. Please ask your instructor to re-upload or
                    reprocess this video.
                  </p>
                  <button
                    type="button"
                    onClick={load}
                    className="mt-lg text-label-md text-emerald-400 underline"
                  >
                    Retry
                  </button>
                </div>
              )}
              {activeTab === "VIDEO" && activeMedia.uploadStatus !== "FAILED" && (
                <VideoPlayer
                  lectureId={lectureId}
                  mediaId={activeMedia._id}
                />
              )}
              {activeTab === "AUDIO" && (
                <AudioPlayer
                  lectureId={lectureId}
                  mediaId={activeMedia._id}
                  title={activeMedia.fileName || displayTitle}
                />
              )}
              {activeTab === "PDF" && (
                <PdfViewer
                  mediaId={activeMedia._id}
                  userEmail={userEmail}
                  title={activeMedia.fileName || displayTitle}
                />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
