"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { MaterialIcon } from "../../components/MaterialIcon";
import { api } from "../../lib/api";

type FileType = "VIDEO" | "AUDIO" | "PDF";
type UploadStatus = "PENDING" | "PROCESSING" | "READY" | "FAILED";

type IdItem = { _id: string; name?: string; title?: string };

type LectureOption = {
  id: string;
  label: string;
  yearId: string;
  termId: string;
  subjectId: string;
  sectionId: string;
};

function idOf(item: { _id: unknown }): string {
  return String(item._id);
}

type MediaItem = {
  _id: string;
  fileName: string;
  fileType: FileType;
  uploadStatus: UploadStatus;
  createdAt: string;
};

const selectClass =
  "w-full rounded border border-outline-variant bg-surface p-sm text-body-sm text-on-surface outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50";

const FILE_TYPE_CONFIG: Record<
  FileType,
  {
    accept: string;
    maxBytes: number;
    limitLabel: string;
    icon: string;
    mimes: string[];
  }
> = {
  VIDEO: {
    accept: "video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov",
    maxBytes: 2 * 1024 * 1024 * 1024,
    limitLabel: "2 GB",
    icon: "movie",
    mimes: ["video/mp4", "video/webm", "video/quicktime"],
  },
  AUDIO: {
    accept: "audio/mpeg,audio/mp4,audio/wav,.mp3,.m4a,.wav",
    maxBytes: 500 * 1024 * 1024,
    limitLabel: "500 MB",
    icon: "audio_file",
    mimes: ["audio/mpeg", "audio/mp4", "audio/wav", "audio/x-wav"],
  },
  PDF: {
    accept: "application/pdf,.pdf",
    maxBytes: 50 * 1024 * 1024,
    limitLabel: "50 MB",
    icon: "description",
    mimes: ["application/pdf"],
  },
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function validateFile(file: File, fileType: FileType): string | null {
  const cfg = FILE_TYPE_CONFIG[fileType];
  if (!cfg.mimes.includes(file.type)) {
    return `File type ${file.type || "unknown"} is not allowed for ${fileType}.`;
  }
  if (file.size > cfg.maxBytes) {
    return `File exceeds maximum size (${cfg.limitLabel}).`;
  }
  return null;
}

function getMediaDuration(file: File): Promise<number | undefined> {
  if (!file.type.startsWith("video/") && !file.type.startsWith("audio/")) {
    return Promise.resolve(undefined);
  }
  return new Promise((resolve) => {
    const el = document.createElement(
      file.type.startsWith("video/") ? "video" : "audio",
    );
    el.preload = "metadata";
    const url = URL.createObjectURL(file);
    el.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(el.duration) ? Math.floor(el.duration) : undefined);
    };
    el.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(undefined);
    };
    el.src = url;
  });
}

async function getCsrfToken(): Promise<string> {
  const res = await fetch("/api/csrf", {
    credentials: "include",
    cache: "no-store",
  });
  const data = (await res.json()) as { signedToken?: string };
  const signed =
    data.signedToken?.trim() ?? res.headers.get("X-CSRF-Token")?.trim();
  if (!signed) throw new Error("CSRF token unavailable");
  return signed;
}

function uploadWithProgress(
  url: string,
  method: "PUT" | "POST",
  body: Blob | FormData,
  headers: Record<string, string>,
  onProgress: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed (HTTP ${xhr.status})`));
    });
    xhr.addEventListener("error", () => reject(new Error("Upload failed")));
    xhr.open(method, url);
    for (const [key, value] of Object.entries(headers)) {
      xhr.setRequestHeader(key, value);
    }
    xhr.send(body);
  });
}

function uploadToR2(
  uploadUrl: string,
  file: File,
  onProgress: (pct: number) => void,
): Promise<void> {
  return uploadWithProgress(
    uploadUrl,
    "PUT",
    file,
    { "Content-Type": file.type },
    onProgress,
  );
}

async function uploadToLocalProject(
  mediaId: string,
  file: File,
  onProgress: (pct: number) => void,
  options?: { fallback?: boolean },
): Promise<void> {
  const csrf = await getCsrfToken();
  const formData = new FormData();
  formData.append("file", file);
  const fallback = options?.fallback ? "&fallback=1" : "";
  await uploadWithProgress(
    `/api/media/upload?mediaId=${encodeURIComponent(mediaId)}${fallback}`,
    "POST",
    formData,
    { "X-CSRF-Token": csrf },
    onProgress,
  );
}

function uploadStatusLabel(
  status: UploadStatus,
  t: (
    key:
      | "statusReady"
      | "statusProcessing"
      | "statusPending"
      | "statusFailed"
      | "statusIncomplete",
  ) => string,
): string {
  switch (status) {
    case "READY":
      return t("statusReady");
    case "PROCESSING":
      return t("statusProcessing");
    case "PENDING":
      return t("statusIncomplete");
    case "FAILED":
      return t("statusFailed");
    default:
      return status;
  }
}

function statusChipClass(status: UploadStatus): string {
  switch (status) {
    case "READY":
      return "bg-primary/20 text-primary";
    case "PROCESSING":
    case "PENDING":
      return "bg-tertiary-container text-on-tertiary-container";
    case "FAILED":
      return "bg-error-container text-on-error-container";
    default:
      return "bg-surface-variant text-on-surface-variant";
  }
}

function fileTypeIcon(type: FileType): string {
  return FILE_TYPE_CONFIG[type].icon;
}

export default function MediaUploadPage() {
  const t = useTranslations("admin.uploads");

  const [years, setYears] = useState<IdItem[]>([]);
  const [terms, setTerms] = useState<IdItem[]>([]);
  const [subjects, setSubjects] = useState<IdItem[]>([]);
  const [sections, setSections] = useState<IdItem[]>([]);
  const [lectures, setLectures] = useState<IdItem[]>([]);

  const [yearId, setYearId] = useState("");
  const [termId, setTermId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [lectureId, setLectureId] = useState("");
  const [lectureOptions, setLectureOptions] = useState<LectureOption[]>([]);
  const [loadingLectureOptions, setLoadingLectureOptions] = useState(true);

  const [fileType, setFileType] = useState<FileType>("VIDEO");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadPhase, setUploadPhase] = useState("");

  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);

  const [toast, setToast] = useState<{
    message: string;
    icon: string;
    error?: boolean;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cfg = FILE_TYPE_CONFIG[fileType];

  const showToast = useCallback(
    (message: string, icon: string, error = false) => {
      setToast({ message, icon, error });
    },
    [],
  );

  const loadMedia = useCallback(async () => {
    if (!lectureId) {
      setMediaList([]);
      return;
    }
    setLoadingMedia(true);
    try {
      const data = await api<{ media: MediaItem[] }>(
        `/api/media?lectureId=${lectureId}`,
      );
      setMediaList(data.media);
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : t("loadMediaFailed"),
        "error",
        true,
      );
    } finally {
      setLoadingMedia(false);
    }
  }, [lectureId, showToast, t]);

  const loadLectureOptions = useCallback(async () => {
    setLoadingLectureOptions(true);
    try {
      const data = await api<{ lectures: LectureOption[] }>(
        "/api/media/lecture-options",
      );
      setLectureOptions(data.lectures);
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : t("loadMediaFailed"),
        "error",
        true,
      );
      setLectureOptions([]);
    } finally {
      setLoadingLectureOptions(false);
    }
  }, [showToast, t]);

  useEffect(() => {
    loadLectureOptions();
  }, [loadLectureOptions]);

  useEffect(() => {
    api<{ academicYears: IdItem[] }>("/api/academic-years")
      .then((d) => setYears(d.academicYears))
      .catch((e) =>
        showToast(
          e instanceof Error ? e.message : t("loadYearsFailed"),
          "error",
          true,
        ),
      );
  }, [showToast, t]);

  useEffect(() => {
    if (!yearId) {
      setTerms([]);
      return;
    }
    api<{ terms: IdItem[] }>(`/api/terms?academicYearId=${yearId}`)
      .then((d) => setTerms(d.terms))
      .catch(() => setTerms([]));
  }, [yearId]);

  useEffect(() => {
    if (!termId) {
      setSubjects([]);
      return;
    }
    api<{ subjects: IdItem[] }>(`/api/subjects?termId=${termId}`)
      .then((d) => setSubjects(d.subjects))
      .catch(() => setSubjects([]));
  }, [termId]);

  useEffect(() => {
    if (!subjectId) {
      setSections([]);
      return;
    }
    api<{ sections: IdItem[] }>(`/api/sections?subjectId=${subjectId}`)
      .then((d) => setSections(d.sections))
      .catch(() => setSections([]));
  }, [subjectId]);

  useEffect(() => {
    if (!sectionId) {
      setLectures([]);
      return;
    }
    api<{ lectures: IdItem[] }>(`/api/lectures?sectionId=${sectionId}`)
      .then((d) => setLectures(d.lectures))
      .catch(() => setLectures([]));
  }, [sectionId]);

  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  const needsPoll = mediaList.some((m) => m.uploadStatus === "PROCESSING");

  useEffect(() => {
    if (!lectureId || !needsPoll) return;
    const id = setInterval(loadMedia, 5000);
    return () => clearInterval(id);
  }, [lectureId, needsPoll, loadMedia]);

  async function deleteMediaItem(mediaId: string) {
    try {
      await api(`/api/media/${mediaId}`, { method: "DELETE" });
      await loadMedia();
      showToast(t("deleteMedia"), "delete");
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : t("deleteMediaFailed"),
        "error",
        true,
      );
    }
  }

  function selectLectureOption(option: LectureOption) {
    setYearId(option.yearId);
    setTermId(option.termId);
    setSubjectId(option.subjectId);
    setSectionId(option.sectionId);
    setLectureId(option.id);
    setSelectedFile(null);
    setUploadProgress(0);
    setUploadPhase("");
  }

  function resetCascade(from: "year" | "term" | "subject" | "section") {
    if (from === "year") {
      setTermId("");
      setSubjectId("");
      setSectionId("");
      setLectureId("");
    } else if (from === "term") {
      setSubjectId("");
      setSectionId("");
      setLectureId("");
    } else if (from === "subject") {
      setSectionId("");
      setLectureId("");
    } else {
      setLectureId("");
    }
    setSelectedFile(null);
    setUploadProgress(0);
  }

  function pickFile(file: File | null) {
    if (!file) return;
    const err = validateFile(file, fileType);
    if (err) {
      showToast(err, "error", true);
      return;
    }
    setSelectedFile(file);
    setUploadProgress(0);
    setUploadPhase("");
  }

  async function startUpload() {
    if (!lectureId) {
      showToast(t("selectLectureError"), "error", true);
      return;
    }
    if (!selectedFile) {
      showToast(t("chooseFileError"), "error", true);
      return;
    }

    const validationError = validateFile(selectedFile, fileType);
    if (validationError) {
      showToast(validationError, "error", true);
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      setUploadPhase(t("requestingUrl"));
      const presign = await api<{
        mediaId: string;
        uploadUrl: string;
        storage?: "r2" | "local";
      }>("/api/media/presign", {
        method: "POST",
        body: JSON.stringify({
          lectureId,
          fileName: selectedFile.name,
          fileType,
          mimeType: selectedFile.type,
          fileSize: selectedFile.size,
        }),
      });

      let useLocalStorage =
        presign.storage === "local" ||
        presign.uploadUrl.startsWith("/api/media/upload");

      setUploadPhase(
        useLocalStorage ? t("uploadingLocal") : t("uploadingStorage"),
      );

      if (useLocalStorage) {
        await uploadToLocalProject(
          presign.mediaId,
          selectedFile,
          setUploadProgress,
        );
      } else {
        try {
          await uploadToR2(
            presign.uploadUrl,
            selectedFile,
            setUploadProgress,
          );
        } catch {
          setUploadPhase(t("uploadingLocal"));
          await uploadToLocalProject(
            presign.mediaId,
            selectedFile,
            setUploadProgress,
          );
          useLocalStorage = true;
        }
      }

      setUploadPhase(t("confirming"));
      const durationSeconds = await getMediaDuration(selectedFile);
      await api<{ media: MediaItem; message: string }>("/api/media/confirm", {
        method: "POST",
        body: JSON.stringify({
          mediaId: presign.mediaId,
          ...(durationSeconds !== undefined ? { durationSeconds } : {}),
        }),
      });

      showToast(
        useLocalStorage ? t("uploadCompleteLocal") : t("uploadComplete"),
        "cloud_done",
      );
      setSelectedFile(null);
      setUploadProgress(0);
      setUploadPhase("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      await loadMedia();
      await loadLectureOptions();
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : t("uploadFailed"),
        "error",
        true,
      );
      setUploadPhase("");
    } finally {
      setUploading(false);
    }
  }

  const queueItems = mediaList.filter((m) => m.uploadStatus === "PROCESSING");
  const incompleteItems = mediaList.filter(
    (m) => m.uploadStatus === "PENDING" || m.uploadStatus === "FAILED",
  );

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

      {/* Quick lecture picker */}
      <section className="space-y-sm rounded-xl border border-primary/30 bg-primary-container/10 p-md">
        <div>
          <h2 className="text-headline-sm font-semibold text-on-surface">
            {t("pickLecture")}
          </h2>
          <p className="text-body-sm text-on-surface-variant">
            {t("pickLectureHint")}
          </p>
        </div>
        {loadingLectureOptions ? (
          <p className="text-body-sm text-on-surface-variant">
            {t("loadingLectures")}
          </p>
        ) : lectureOptions.length === 0 ? (
          <div className="rounded-lg border border-outline-variant bg-surface-container-low p-md">
            <p className="font-medium text-on-surface">{t("noLecturesTitle")}</p>
            <p className="mt-xs text-body-sm text-on-surface-variant">
              {t("noLecturesHint")}
            </p>
            <Link
              href="/admin/hierarchy"
              className="mt-md inline-flex items-center gap-sm rounded-lg bg-primary px-lg py-sm text-label-md text-on-primary"
            >
              <MaterialIcon icon="account_tree" className="text-[18px]" />
              {t("goToHierarchy")}
            </Link>
          </div>
        ) : (
          <select
            className={selectClass}
            value={lectureId}
            onChange={(e) => {
              const option = lectureOptions.find((o) => o.id === e.target.value);
              if (option) selectLectureOption(option);
              else {
                setLectureId("");
                setSelectedFile(null);
              }
            }}
          >
            <option value="">{t("selectLecture")}</option>
            {lectureOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        )}
      </section>

      <p className="text-label-sm text-on-surface-variant">{t("orUseFilters")}</p>

      {/* Hierarchy cascade */}
      <section className="grid grid-cols-1 gap-md rounded-xl border border-outline-variant bg-surface-container-low p-md md:grid-cols-5">
        <div className="space-y-xs">
          <label className="text-label-sm uppercase tracking-wider text-on-surface-variant">
            {t("academicYear")}
          </label>
          <select
            className={selectClass}
            value={yearId}
            onChange={(e) => {
              setYearId(e.target.value);
              resetCascade("year");
            }}
          >
            <option value="">{t("selectYear")}</option>
            {years.map((y) => (
              <option key={idOf(y)} value={idOf(y)}>
                {y.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-xs">
          <label className="text-label-sm uppercase tracking-wider text-on-surface-variant">
            {t("term")}
          </label>
          <select
            className={selectClass}
            value={termId}
            disabled={!yearId}
            onChange={(e) => {
              setTermId(e.target.value);
              resetCascade("term");
            }}
          >
            <option value="">{t("selectTerm")}</option>
            {terms.map((term) => (
              <option key={idOf(term)} value={idOf(term)}>
                {term.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-xs">
          <label className="text-label-sm uppercase tracking-wider text-on-surface-variant">
            {t("subject")}
          </label>
          <select
            className={selectClass}
            value={subjectId}
            disabled={!termId}
            onChange={(e) => {
              setSubjectId(e.target.value);
              resetCascade("subject");
            }}
          >
            <option value="">{t("selectSubject")}</option>
            {subjects.map((s) => (
              <option key={idOf(s)} value={idOf(s)}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-xs">
          <label className="text-label-sm uppercase tracking-wider text-on-surface-variant">
            {t("section")}
          </label>
          <select
            className={selectClass}
            value={sectionId}
            disabled={!subjectId}
            onChange={(e) => {
              setSectionId(e.target.value);
              resetCascade("section");
            }}
          >
            <option value="">{t("selectSection")}</option>
            {sections.map((s) => (
              <option key={idOf(s)} value={idOf(s)}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-xs">
          <label className="text-label-sm uppercase tracking-wider text-on-surface-variant">
            {t("lecture")}
          </label>
          <select
            className={selectClass}
            value={lectureId}
            disabled={!sectionId}
            onChange={(e) => {
              const nextId = e.target.value;
              setLectureId(nextId);
              setSelectedFile(null);
              const option = lectureOptions.find((o) => o.id === nextId);
              if (option) {
                setYearId(option.yearId);
                setTermId(option.termId);
                setSubjectId(option.subjectId);
                setSectionId(option.sectionId);
              }
            }}
          >
            <option value="">{t("selectLecture")}</option>
            {lectures.map((l) => (
              <option key={idOf(l)} value={idOf(l)}>
                {l.title}
              </option>
            ))}
          </select>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-lg xl:grid-cols-3">
        {/* Upload zone */}
        <div className="space-y-md xl:col-span-2">
          <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-low">
            <div className="flex border-b border-outline-variant bg-surface-container">
              {(["VIDEO", "AUDIO", "PDF"] as const).map((ft) => (
                <button
                  key={ft}
                  type="button"
                  className={`px-lg py-sm text-label-md transition-colors ${
                    fileType === ft
                      ? "border-b-2 border-primary text-primary"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                  onClick={() => {
                    setFileType(ft);
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                >
                  {ft === "VIDEO"
                    ? t("video")
                    : ft === "AUDIO"
                      ? t("audio")
                      : t("pdf")}
                </button>
              ))}
            </div>

            <div className="p-lg">
              <div
                className={`upload-dashed group flex h-64 cursor-pointer flex-col items-center justify-center space-y-md rounded-xl transition-all hover:bg-surface-container-highest ${
                  !lectureId ? "pointer-events-none opacity-50" : ""
                }`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  pickFile(e.dataTransfer.files[0] ?? null);
                }}
                onClick={() => lectureId && fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (
                    lectureId &&
                    (e.key === "Enter" || e.key === " ")
                  ) {
                    fileInputRef.current?.click();
                  }
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={cfg.accept}
                  className="hidden"
                  disabled={!lectureId || uploading}
                  onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
                />
                <MaterialIcon
                  icon={cfg.icon}
                  className="text-5xl text-outline transition-colors group-hover:text-primary"
                />
                <div className="text-center">
                  <p className="text-body-lg font-bold text-on-surface">
                    {t("dragDrop")}{" "}
                    <span className="text-primary">{t("clickUpload")}</span>
                  </p>
                  <p className="text-body-sm text-on-surface-variant">
                    {t("maxFileSize", { size: cfg.limitLabel })}
                  </p>
                  {!lectureId && (
                    <p className="mt-xs text-body-sm font-medium text-tertiary">
                      {t("pickLectureHint")}
                    </p>
                  )}
                </div>
              </div>

              {selectedFile && (
                <div className="mt-lg rounded-xl border border-primary/30 bg-surface-container-high p-md">
                  <div className="mb-sm flex items-center justify-between">
                    <div className="flex min-w-0 items-center gap-md">
                      <MaterialIcon icon="description" className="text-primary" />
                      <div className="min-w-0">
                        <p className="truncate font-label-md text-on-surface">
                          {selectedFile.name}
                        </p>
                        <p className="text-label-sm text-on-surface-variant">
                          {formatBytes(selectedFile.size)} · {selectedFile.type}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={uploading || !lectureId}
                      className="shrink-0 rounded bg-primary px-lg py-xs font-label-md text-on-primary transition-all hover:brightness-110 disabled:opacity-60"
                      onClick={startUpload}
                    >
                      {uploading ? t("uploading") : t("startUpload")}
                    </button>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <div className="mt-xs flex justify-between">
                    <span className="text-label-sm text-on-surface-variant">
                      {uploadProgress}%
                    </span>
                    <span className="text-label-sm text-on-surface-variant">
                      {uploadPhase || (uploading ? t("inProgress") : t("ready"))}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Queue status */}
        <div className="space-y-md">
          <div className="h-full rounded-xl border border-outline-variant bg-surface-container-low p-md">
            <h3 className="mb-md flex items-center gap-sm text-headline-md font-semibold text-on-surface">
              <MaterialIcon icon="sync_alt" className="text-primary" />
              {t("processingQueue")}
            </h3>
            <div className="space-y-sm">
              {!lectureId ? (
                <p className="text-body-sm text-on-surface-variant">
                  {t("selectLectureError")}
                </p>
              ) : queueItems.length === 0 ? (
                <p className="text-body-sm text-on-surface-variant">
                  {t("noMedia")}
                </p>
              ) : (
                queueItems.map((m) => (
                  <div
                    key={m._id}
                    className="flex items-center justify-between rounded-lg border border-outline-variant bg-surface-container p-sm"
                  >
                    <div className="flex min-w-0 items-center gap-sm">
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${
                          m.uploadStatus === "FAILED"
                            ? "bg-error"
                            : "animate-pulse bg-tertiary"
                        }`}
                      />
                      <span className="truncate text-body-sm font-medium">
                        {m.fileName}
                      </span>
                    </div>
                    <span
                      className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-tighter ${statusChipClass(m.uploadStatus)}`}
                    >
                      {uploadStatusLabel(m.uploadStatus, t)}
                    </span>
                  </div>
                ))
              )}
            </div>
            {needsPoll && (
              <div className="mt-md rounded bg-surface-container-highest p-sm text-center">
                <p className="text-label-sm text-on-surface-variant">
                  {t("inProgress")}
                </p>
              </div>
            )}
            {incompleteItems.length > 0 && (
              <div className="mt-md space-y-sm border-t border-outline-variant pt-md">
                <p className="text-label-md font-semibold text-on-surface">
                  {t("incompleteUploads")}
                </p>
                <p className="text-label-sm text-on-surface-variant">
                  {t("incompleteHint")}
                </p>
                {incompleteItems.map((m) => (
                  <div
                    key={m._id}
                    className="flex items-center justify-between gap-sm rounded-lg border border-error/30 bg-error-container/10 p-sm"
                  >
                    <span className="min-w-0 truncate text-body-sm">
                      {m.fileName}
                    </span>
                    <button
                      type="button"
                      className="shrink-0 rounded px-sm py-xs text-label-sm text-error"
                      onClick={() => deleteMediaItem(m._id)}
                    >
                      {t("deleteMedia")}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lecture assets table */}
      <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-low">
        <div className="flex items-center justify-between border-b border-outline-variant p-md">
          <h3 className="text-headline-md font-semibold text-on-surface">
            {t("mediaLibrary")}
          </h3>
          <button
            type="button"
            className="rounded p-xs text-on-surface-variant transition-colors hover:bg-surface-container-high"
            onClick={loadMedia}
            aria-label={t("refreshList")}
          >
            <MaterialIcon icon="refresh" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-start">
            <thead className="border-b border-outline-variant bg-surface-container">
              <tr>
                <th className="p-md text-label-md uppercase text-on-surface-variant">
                  {t("mediaLibrary")}
                </th>
                <th className="p-md text-label-md uppercase text-on-surface-variant">
                  {t("video")}
                </th>
                <th className="p-md text-label-md uppercase text-on-surface-variant">
                  {t("statusReady")}
                </th>
                <th className="p-md text-end text-label-md uppercase text-on-surface-variant">
                  {t("ready")}
                </th>
                <th className="p-md text-end text-label-md uppercase text-on-surface-variant">
                  {t("deleteMedia")}
                </th>
              </tr>
            </thead>
            <tbody>
              {!lectureId ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-xl text-center text-body-sm text-on-surface-variant"
                  >
                    {t("selectLectureError")}
                  </td>
                </tr>
              ) : loadingMedia && mediaList.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-xl text-center text-body-sm text-on-surface-variant"
                  >
                    {t("uploading")}
                  </td>
                </tr>
              ) : mediaList.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-xl text-center text-body-sm text-on-surface-variant"
                  >
                    {t("noMedia")}
                  </td>
                </tr>
              ) : (
                mediaList.map((m) => (
                  <tr
                    key={m._id}
                    className="border-b border-outline-variant transition-colors hover:bg-surface-container-high"
                  >
                    <td className="p-md">
                      <div className="flex items-center gap-sm">
                        <MaterialIcon
                          icon={fileTypeIcon(m.fileType)}
                          className="text-primary"
                        />
                        <span className="text-body-sm font-medium">
                          {m.fileName}
                        </span>
                      </div>
                    </td>
                    <td className="p-md text-body-sm capitalize text-on-surface-variant">
                      {m.fileType.toLowerCase()}
                    </td>
                    <td className="p-md">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${statusChipClass(m.uploadStatus)}`}
                      >
                        {uploadStatusLabel(m.uploadStatus, t)}
                      </span>
                    </td>
                    <td className="p-md text-end text-body-sm text-on-surface-variant">
                      {new Date(m.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="p-md text-end">
                      {(m.uploadStatus === "PENDING" ||
                        m.uploadStatus === "FAILED") && (
                        <button
                          type="button"
                          className="rounded px-sm py-xs text-label-sm text-error hover:bg-error-container/20"
                          onClick={() => deleteMediaItem(m._id)}
                        >
                          {t("deleteMedia")}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
