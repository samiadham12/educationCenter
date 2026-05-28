"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { MaterialIcon } from "../MaterialIcon";
import { api } from "../../lib/api";
import { streamClientHeaders } from "../../lib/stream-client";
import {
  createSecureHls,
  hlsPlaylistBlobUrl,
} from "../../lib/secure-hls";

const SPEEDS = [1, 1.25, 1.5, 2, 2.5, 3] as const;
const PLAYBACK_RATE_KEY = "video-playback-rate";

export interface VideoPlayerProps {
  lectureId: string;
  mediaId: string;
  onError?: (message: string) => void;
}

type HlsInlineManifest = {
  playback: "hls";
  mediaId: string;
  hlsPlaylist: string;
};
type LegacyManifest = { manifestUrl: string };
type ManifestResponse = HlsInlineManifest | LegacyManifest;
type ApiErrorResponse = { error?: string; details?: { reason?: string } };
type ProgressResponse = {
  progress: {
    lastPosition: number;
    watchedSeconds?: number;
    totalDuration?: number;
  } | null;
};

function readSavedPlaybackRate(): number {
  if (typeof window === "undefined") return 1;
  const saved = localStorage.getItem(PLAYBACK_RATE_KEY);
  if (!saved) return 1;
  const rate = parseFloat(saved);
  return (SPEEDS as readonly number[]).includes(rate) ? rate : 1;
}

export function VideoPlayer({ lectureId, mediaId, onError }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const playlistBlobRef = useRef<string | null>(null);
  const lastPositionRef = useRef(0);
  const hasResumedRef = useRef(false);
  const loadIdRef = useRef(0);

  const [playbackRate, setPlaybackRate] = useState(readSavedPlaybackRate);
  const [isLoading, setIsLoading] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [processing, setProcessing] = useState(false);

  const revokePlaylistBlob = useCallback(() => {
    if (playlistBlobRef.current) {
      URL.revokeObjectURL(playlistBlobRef.current);
      playlistBlobRef.current = null;
    }
  }, []);

  const destroyHls = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    revokePlaylistBlob();
  }, [revokePlaylistBlob]);

  const reportError = useCallback(
    (message: string) => {
      setError(message);
      setIsLoading(false);
      onError?.(message);
    },
    [onError],
  );

  const initPlayback = useCallback(async () => {
    const loadId = ++loadIdRef.current;
    const video = videoRef.current;
    if (!video) return;

    destroyHls();
    hasResumedRef.current = false;
    setIsLoading(true);
    setIsBuffering(false);
    setError(null);
    setReady(false);
    setProcessing(false);
    video.removeAttribute("src");
    video.load();

    try {
      let manifestUrl: string | null = null;
      let secureHlsMediaId: string | null = null;
      for (let attempt = 0; attempt < 20; attempt++) {
        try {
          const res = await fetch(`/api/stream/${mediaId}/manifest`, {
            credentials: "include",
            cache: "no-store",
            headers: streamClientHeaders(),
          });
          if (res.ok) {
            const data = (await res.json()) as ManifestResponse;
            if ("playback" in data && data.playback === "hls") {
              revokePlaylistBlob();
              playlistBlobRef.current = hlsPlaylistBlobUrl(data.hlsPlaylist);
              manifestUrl = playlistBlobRef.current;
              secureHlsMediaId = data.mediaId;
            } else {
              manifestUrl = data.manifestUrl;
            }
            break;
          }
          const data = (await res.json().catch(() => ({}))) as ApiErrorResponse;
          if (
            res.status === 409 &&
            data.details?.reason === "TRANSCODE_FAILED"
          ) {
            throw new Error(
              "Video processing failed. Please ask your instructor to re-upload the video.",
            );
          }
          if (
            res.status === 409 &&
            (data.details?.reason === "PROCESSING" ||
              data.details?.reason === "HLS_NOT_GENERATED")
          ) {
            if (loadId !== loadIdRef.current) return;
            setProcessing(true);
            await new Promise((r) => setTimeout(r, 1500));
            continue;
          }
          throw new Error(data.error ?? "Unable to play video");
        } catch (e) {
          // Network/transient errors: small retry window
          if (attempt < 3) {
            await new Promise((r) => setTimeout(r, 800));
            continue;
          }
          throw e;
        }
      }

      if (!manifestUrl) {
        reportError("Video is still processing");
        return;
      }

      let lastPosition = 0;
      try {
        const { progress } = await api<ProgressResponse>(
          `/api/progress/${mediaId}`,
        );
        lastPosition = progress?.lastPosition ?? 0;
      } catch {
        lastPosition = 0;
      }
      lastPositionRef.current = lastPosition;

      if (loadId !== loadIdRef.current) return;

      const isHls =
        manifestUrl.startsWith("blob:") || /\.m3u8(\?|$)/.test(manifestUrl);
      const useSecureLoader = secureHlsMediaId !== null;

      if (isHls && Hls.isSupported()) {
        const hls = useSecureLoader
          ? createSecureHls(secureHlsMediaId!)
          : new Hls({
              xhrSetup(xhr) {
                xhr.withCredentials = true;
              },
            });
        hlsRef.current = hls;
        hls.loadSource(manifestUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (loadId === loadIdRef.current) setIsLoading(false);
        });

        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal && loadId === loadIdRef.current) {
            reportError("Unable to play video");
          }
        });
      } else if (
        isHls &&
        !useSecureLoader &&
        video.canPlayType("application/vnd.apple.mpegurl")
      ) {
        video.src = manifestUrl;
      } else if (!isHls) {
        video.src = manifestUrl;
      } else {
        reportError("Unable to play video");
        return;
      }

      const onLoadedMetadata = () => {
        if (loadId !== loadIdRef.current || hasResumedRef.current) return;
        hasResumedRef.current = true;
        if (lastPositionRef.current > 0 && Number.isFinite(lastPositionRef.current)) {
          video.currentTime = lastPositionRef.current;
        }
        video.playbackRate = readSavedPlaybackRate();
        setReady(true);
        setIsLoading(false);
      };

      video.addEventListener("loadedmetadata", onLoadedMetadata, { once: true });
    } catch {
      if (loadId !== loadIdRef.current) return;
      reportError("Unable to play video");
    }
  }, [mediaId, destroyHls, reportError, revokePlaylistBlob]);

  useEffect(() => {
    initPlayback();
    return () => {
      loadIdRef.current += 1;
      destroyHls();
    };
  }, [initPlayback, destroyHls]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) video.playbackRate = playbackRate;
  }, [playbackRate, ready]);

  useEffect(() => {
    if (!ready) return;

    const sendHeartbeat = () => {
      const video = videoRef.current;
      if (!video || !Number.isFinite(video.duration)) return;

      const isPlaying = !video.paused && !document.hidden;
      if (!isPlaying) return;

      api("/api/progress/heartbeat", {
        method: "POST",
        body: JSON.stringify({
          mediaId,
          lectureId,
          currentTimeSeconds: Math.floor(video.currentTime),
          durationSeconds: Math.max(1, Math.floor(video.duration)),
          isPlaying: true,
        }),
      }).catch(() => {});
    };

    const interval = setInterval(sendHeartbeat, 1000);
    const onVisibilityChange = () => {
      if (!document.hidden) sendHeartbeat();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [mediaId, lectureId, ready]);

  const handleSpeedChange = (rate: number) => {
    setPlaybackRate(rate);
    localStorage.setItem(PLAYBACK_RATE_KEY, String(rate));
    if (videoRef.current) videoRef.current.playbackRate = rate;
  };

  return (
    <div
      className="video-shell relative w-full overflow-hidden rounded-xl border border-outline-variant bg-black shadow-xl"
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="relative flex aspect-video items-center justify-center bg-black">
        <video
          ref={videoRef}
          className="h-full w-full"
          controls
          controlsList="nodownload noplaybackrate"
          playsInline
          disablePictureInPicture
          onContextMenu={(e) => e.preventDefault()}
          onWaiting={() => setIsBuffering(true)}
          onPlaying={() => setIsBuffering(false)}
          onCanPlay={() => setIsBuffering(false)}
        />

        {(isLoading || isBuffering) && !error && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        )}

        {processing && !error && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <p className="rounded-lg bg-black/60 px-4 py-2 text-sm font-semibold text-white">
              Video is processing… please wait
            </p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-surface-container-high/95 p-6 text-center">
            <MaterialIcon
              icon="error_outline"
              className="mb-4 text-5xl text-error"
            />
            <p className="mb-4 text-body-lg font-medium text-on-surface">
              {error}
            </p>
            <button
              type="button"
              onClick={() => initPlayback()}
              className="rounded-full bg-primary px-6 py-2 font-semibold text-on-primary transition-colors hover:bg-primary-container hover:text-on-primary-container"
            >
              Retry
            </button>
          </div>
        )}

        {ready && !error && (
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-4 pb-2 pt-8">
            <span className="text-[10px] text-white/60">
              Protected stream · no right-click
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center justify-between gap-4 border-t border-outline-variant bg-surface-container-low p-4 md:flex-row">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="text-label-md font-medium text-on-surface-variant">
            Speed:
          </span>
          <div className="flex flex-wrap rounded-lg border border-outline-variant bg-surface-container-highest p-0.5">
            {SPEEDS.map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => handleSpeedChange(rate)}
                className={`rounded-md px-3 py-1 text-label-sm font-bold transition-all duration-200 ${
                  playbackRate === rate
                    ? "bg-primary text-on-primary shadow-sm"
                    : "text-on-surface-variant hover:bg-surface-variant hover:text-on-surface"
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 text-on-surface-variant">
          <MaterialIcon icon="cloud_done" className="text-primary text-body-sm" />
          <span className="text-label-sm font-medium">
            Progress saved automatically
          </span>
        </div>
      </div>
    </div>
  );
}
