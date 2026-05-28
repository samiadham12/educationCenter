"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { MaterialIcon } from "../MaterialIcon";
import { api } from "../../lib/api";
import {
  STREAM_CLIENT_HEADER,
  STREAM_CLIENT_VALUE,
  streamClientHeaders,
} from "../../lib/stream-client";

const SPEEDS = [1, 1.25, 1.5, 2, 2.5, 3] as const;
const PLAYBACK_RATE_KEY = "audio-playback-rate";
const WAVE_BAR_COUNT = 24;

export interface AudioPlayerProps {
  lectureId: string;
  mediaId: string;
  title?: string;
  onError?: (message: string) => void;
}

type ManifestResponse = { manifestUrl: string };
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

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function AudioPlayer({
  lectureId,
  mediaId,
  title = "Lecture Audio",
  onError,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const lastPositionRef = useRef(0);
  const hasResumedRef = useRef(false);
  const loadIdRef = useRef(0);
  const isSeekingRef = useRef(false);

  const [playbackRate, setPlaybackRate] = useState(readSavedPlaybackRate);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const destroyHls = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
  }, []);

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
    const audio = audioRef.current;
    if (!audio) return;

    destroyHls();
    hasResumedRef.current = false;
    setIsLoading(true);
    setError(null);
    setReady(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    audio.removeAttribute("src");
    audio.pause();

    try {
      const { manifestUrl } = await api<ManifestResponse>(
        `/api/stream/${mediaId}/manifest`,
        { headers: streamClientHeaders() },
      );

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

      const isHls = /\.m3u8(\?|$)/.test(manifestUrl);

      if (isHls && Hls.isSupported()) {
        const hls = new Hls({
          xhrSetup(xhr) {
            xhr.withCredentials = true;
            xhr.setRequestHeader(STREAM_CLIENT_HEADER, STREAM_CLIENT_VALUE);
          },
        });
        hlsRef.current = hls;
        hls.loadSource(manifestUrl);
        hls.attachMedia(audio);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (loadId === loadIdRef.current) setIsLoading(false);
        });

        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal && loadId === loadIdRef.current) {
            reportError("Unable to play audio");
          }
        });
      } else if (isHls && audio.canPlayType("application/vnd.apple.mpegurl")) {
        audio.src = manifestUrl;
      } else if (!isHls) {
        audio.src = manifestUrl;
      } else {
        reportError("Unable to play audio");
        return;
      }

      const onLoadedMetadata = () => {
        if (loadId !== loadIdRef.current || hasResumedRef.current) return;
        hasResumedRef.current = true;
        if (lastPositionRef.current > 0) {
          audio.currentTime = lastPositionRef.current;
        }
        audio.playbackRate = readSavedPlaybackRate();
        setDuration(audio.duration || 0);
        setCurrentTime(audio.currentTime);
        setReady(true);
        setIsLoading(false);
      };

      audio.addEventListener("loadedmetadata", onLoadedMetadata, { once: true });
    } catch {
      if (loadId !== loadIdRef.current) return;
      reportError("Unable to play audio");
    }
  }, [mediaId, destroyHls, reportError]);

  useEffect(() => {
    initPlayback();
    return () => {
      loadIdRef.current += 1;
      destroyHls();
    };
  }, [initPlayback, destroyHls]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      if (!isSeekingRef.current) setCurrentTime(audio.currentTime);
    };
    const onDurationChange = () => setDuration(audio.duration || 0);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
    };
  }, [ready]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.playbackRate = playbackRate;
  }, [playbackRate, ready]);

  useEffect(() => {
    if (!ready) return;

    const sendHeartbeat = () => {
      const audio = audioRef.current;
      if (!audio || !Number.isFinite(audio.duration)) return;
      if (audio.paused || document.hidden) return;

      api("/api/progress/heartbeat", {
        method: "POST",
        body: JSON.stringify({
          mediaId,
          lectureId,
          currentTimeSeconds: Math.floor(audio.currentTime),
          durationSeconds: Math.max(1, Math.floor(audio.duration)),
          isPlaying: true,
        }),
      }).catch(() => {});
    };

    const interval = setInterval(sendHeartbeat, 1000);
    return () => clearInterval(interval);
  }, [mediaId, lectureId, ready]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio || !ready) return;
    if (audio.paused) {
      try {
        await audio.play();
      } catch {
        reportError("Unable to play audio");
      }
    } else {
      audio.pause();
    }
  };

  const seekBy = (delta: number) => {
    const audio = audioRef.current;
    if (!audio || !ready) return;
    const next = Math.min(
      Math.max(0, audio.currentTime + delta),
      audio.duration || 0,
    );
    audio.currentTime = next;
    setCurrentTime(next);
  };

  const handleSeek = (value: number) => {
    const audio = audioRef.current;
    if (!audio || !ready) return;
    audio.currentTime = value;
    setCurrentTime(value);
  };

  const handleSpeedChange = (rate: number) => {
    setPlaybackRate(rate);
    localStorage.setItem(PLAYBACK_RATE_KEY, String(rate));
    if (audioRef.current) audioRef.current.playbackRate = rate;
  };

  const seekPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <section
      className="audio-shell relative w-full overflow-hidden rounded-xl border border-outline-variant bg-surface-container-high shadow-2xl"
      onContextMenu={(e) => e.preventDefault()}
      id="audio-player-container"
    >
      <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container-highest/30 p-md md:p-lg">
        <div className="flex min-w-0 items-center gap-md">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
            <MaterialIcon icon="music_note" className="text-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-headline-md font-semibold text-on-surface">
              {title}
            </h2>
            <p className="text-label-sm tracking-wider text-on-surface-variant">
              Secure stream · no download
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-xs text-primary/80">
          <MaterialIcon icon="verified_user" filled className="text-[18px]" />
          <span className="text-label-sm">Protected</span>
        </div>
      </div>

      <audio
        ref={audioRef}
        preload="metadata"
        controlsList="nodownload"
        className="hidden"
        onContextMenu={(e) => e.preventDefault()}
      />

      <div className="flex flex-col items-center gap-xl p-lg md:p-xl">
        <div
          className={`audio-waveform flex h-24 w-full items-end justify-center gap-[2px] px-md opacity-80 ${isPlaying ? "playing" : ""}`}
          aria-hidden
        >
          {Array.from({ length: WAVE_BAR_COUNT }, (_, i) => (
            <div
              key={i}
              className="wave-bar"
              style={{
                height: isPlaying ? undefined : `${8 + (i % 5) * 4}px`,
              }}
            />
          ))}
        </div>

        <div className="flex w-full flex-col gap-md">
          <div className="flex flex-col gap-xs">
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={currentTime}
              disabled={!ready || !!error}
              onChange={(e) => handleSeek(parseFloat(e.target.value))}
              onMouseDown={() => {
                isSeekingRef.current = true;
              }}
              onMouseUp={() => {
                isSeekingRef.current = false;
              }}
              onTouchStart={() => {
                isSeekingRef.current = true;
              }}
              onTouchEnd={() => {
                isSeekingRef.current = false;
              }}
              className="audio-seek w-full cursor-pointer disabled:opacity-40"
              style={{
                background: `linear-gradient(to right, #4cdbcc ${seekPercent}%, #2d3449 ${seekPercent}%)`,
              }}
              aria-label="Seek"
            />
            <div className="flex justify-between text-label-sm text-on-surface-variant">
              <span className="font-medium text-primary">
                {formatTime(currentTime)}
              </span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-xl py-md">
            <button
              type="button"
              title="Rewind 10s"
              disabled={!ready || !!error}
              onClick={() => seekBy(-10)}
              className="text-on-surface-variant transition-colors hover:text-primary disabled:opacity-40"
            >
              <MaterialIcon icon="replay_10" className="text-[32px]" />
            </button>
            <button
              type="button"
              disabled={isLoading || !!error || !ready}
              onClick={togglePlay}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-on-primary shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              <MaterialIcon
                icon={isPlaying ? "pause" : "play_arrow"}
                className="text-[40px]"
              />
            </button>
            <button
              type="button"
              title="Forward 30s"
              disabled={!ready || !!error}
              onClick={() => seekBy(30)}
              className="text-on-surface-variant transition-colors hover:text-primary disabled:opacity-40"
            >
              <MaterialIcon icon="forward_30" className="text-[32px]" />
            </button>
          </div>
        </div>

        <div className="w-full border-t border-outline-variant pt-lg">
          <span className="mb-md block text-center text-label-md uppercase tracking-widest text-on-surface-variant">
            Playback speed
          </span>
          <div className="flex flex-wrap justify-center gap-sm">
            {SPEEDS.map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => handleSpeedChange(rate)}
                className={`rounded-lg border px-md py-sm text-label-md font-semibold transition-all ${
                  playbackRate === rate
                    ? "border-primary bg-primary text-on-primary shadow-sm"
                    : "border-outline-variant bg-surface-container-highest text-on-surface hover:border-primary hover:bg-primary hover:text-on-primary"
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-outline-variant bg-surface-container px-lg py-sm">
        <div className="flex items-center gap-xs text-on-surface-variant">
          <MaterialIcon icon="cloud_done" className="text-sm text-primary" />
          <span className="text-body-sm">Progress saved automatically</span>
        </div>
        {isPlaying && ready && (
          <div className="flex items-center gap-sm">
            <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
            <span className="text-label-sm uppercase text-primary">
              Playing
            </span>
          </div>
        )}
      </div>

      {isLoading && !error && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface-container-low/70 backdrop-blur-sm">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}

      {error && (
        <div className="flex items-center justify-center gap-md border-t border-error/20 bg-error/10 p-md">
          <MaterialIcon icon="error_outline" className="text-error" />
          <p className="text-label-md font-bold text-error">{error}</p>
          <button
            type="button"
            onClick={() => initPlayback()}
            className="text-label-md font-bold underline hover:text-error-container"
          >
            Retry
          </button>
        </div>
      )}
    </section>
  );
}
