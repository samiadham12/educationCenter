"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MaterialIcon } from "../MaterialIcon";
import { streamClientHeaders } from "../../lib/stream-client";

const WATERMARK_TILES = 18;

export interface PdfViewerProps {
  mediaId: string;
  userEmail: string;
  title?: string;
  onError?: (message: string) => void;
}

export function PdfViewer({
  mediaId,
  userEmail,
  title = "Lecture Document",
  onError,
}: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const blobUrlRef = useRef<string | null>(null);
  const loadIdRef = useRef(0);

  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const revokeBlob = useCallback(() => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setBlobUrl(null);
  }, []);

  const reportError = useCallback(
    (message: string) => {
      setError(message);
      setIsLoading(false);
      onError?.(message);
    },
    [onError],
  );

  const fetchPdf = useCallback(async () => {
    const loadId = ++loadIdRef.current;
    setIsLoading(true);
    setError(null);
    revokeBlob();

    try {
      const res = await fetch(`/api/stream/pdf/${mediaId}`, {
        credentials: "include",
        headers: streamClientHeaders(),
      });

      if (!res.ok) {
        let message = "Document could not be loaded";
        try {
          const json = (await res.json()) as { error?: string };
          if (json.error) message = json.error;
        } catch {
          /* binary or empty body */
        }
        throw new Error(message);
      }

      const blob = await res.blob();
      if (loadId !== loadIdRef.current) return;

      const url = URL.createObjectURL(blob);
      blobUrlRef.current = url;
      setBlobUrl(url);
      setIsLoading(false);
    } catch (err) {
      if (loadId !== loadIdRef.current) return;
      const msg =
        err instanceof Error ? err.message : "Document could not be loaded";
      reportError(msg);
    }
  }, [mediaId, revokeBlob, reportError]);

  useEffect(() => {
    fetchPdf();
    return () => {
      loadIdRef.current += 1;
      revokeBlob();
    };
  }, [fetchPdf, revokeBlob]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current?.contains(document.activeElement)) {
        const target = e.target as Node | null;
        if (!target || !containerRef.current?.contains(target)) return;
      }

      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "s" || e.key === "S" || e.key === "p" || e.key === "P")
      ) {
        e.preventDefault();
      }
    };

    const el = containerRef.current;
    el?.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      el?.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const watermarkLabel = userEmail.trim() || "Licensed viewer";

  const iframeSrc = blobUrl
    ? `${blobUrl}#toolbar=0&navpanes=0`
    : undefined;

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className="pdf-viewer-root no-print relative flex h-[min(80vh,820px)] min-h-[480px] w-full flex-col overflow-hidden rounded-xl border border-outline-variant bg-surface-container shadow-xl"
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="flex items-center justify-between border-b border-outline-variant/50 bg-surface-container px-lg py-md">
        <div className="flex min-w-0 items-center gap-md">
          <MaterialIcon icon="description" filled className="text-primary" />
          <div className="min-w-0">
            <h3 className="truncate text-body-lg font-bold text-on-surface">
              {title}
            </h3>
            <div className="mt-1 flex items-center gap-2">
              <span className="flex items-center gap-1 rounded border border-primary/20 bg-surface-container-highest px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary">
                <MaterialIcon icon="lock" filled className="text-[14px]" />
                Protected
              </span>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-sm rounded-full border border-error/20 bg-error/10 px-sm py-1">
          <MaterialIcon icon="lock" className="text-body-sm text-error" />
          <span className="text-label-sm font-bold uppercase tracking-tighter text-error">
            View only
          </span>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden bg-surface-container-lowest">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-md bg-surface-container-low/80">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="animate-pulse text-label-md font-medium text-on-surface-variant">
              Loading document…
            </p>
          </div>
        )}

        {error && !isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-lg text-center">
            <MaterialIcon
              icon="error_outline"
              className="mb-md text-5xl text-error"
            />
            <p className="mb-lg text-body-lg font-medium text-on-surface">
              {error}
            </p>
            <button
              type="button"
              onClick={() => fetchPdf()}
              className="rounded-full bg-primary px-lg py-sm font-semibold text-on-primary transition-colors hover:bg-primary-container hover:text-on-primary-container"
            >
              Retry
            </button>
          </div>
        )}

        {blobUrl && !error && (
          <div className="relative h-full w-full">
            <iframe
              src={iframeSrc}
              title="Protected document"
              className="h-full w-full border-none"
            />

            <div className="pdf-watermark-pattern absolute inset-0 z-10" />

            <div className="pointer-events-none absolute inset-0 z-20 grid grid-cols-3 grid-rows-6 overflow-hidden opacity-[0.15]">
              {Array.from({ length: WATERMARK_TILES }, (_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-center p-4"
                >
                  <span className="pdf-watermark-text whitespace-nowrap font-bold tracking-tight text-on-surface">
                    {watermarkLabel}
                  </span>
                </div>
              ))}
            </div>

            <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
              <span className="pdf-watermark-text whitespace-nowrap font-black uppercase tracking-widest text-on-surface">
                {watermarkLabel}
              </span>
            </div>
          </div>
        )}
      </div>

      <footer className="flex items-center justify-center gap-2 border-t border-outline-variant bg-surface-container-low px-lg py-3">
        <MaterialIcon icon="warning" filled className="text-tertiary" />
        <p className="text-center text-label-md uppercase tracking-wider text-tertiary">
          Viewing only — downloading and printing disabled
        </p>
      </footer>
    </div>
  );
}
