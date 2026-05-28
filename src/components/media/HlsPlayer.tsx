"use client";

import { useEffect, useRef, useState } from "react";
import {
  STREAM_CLIENT_HEADER,
  STREAM_CLIENT_VALUE,
} from "@/shared/utils/stream-client-guard";

type Props = {
  manifestUrl: string;
  initialSpeed?: number;
  onHeartbeat?: (currentTime: number, duration: number, playing: boolean) => void;
};

const SPEEDS = [1, 1.25, 1.5, 2, 2.5, 3];

export function HlsPlayer({
  manifestUrl,
  initialSpeed = 1,
  onHeartbeat,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [speed, setSpeed] = useState(initialSpeed);
  const [error, setError] = useState("");

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: { destroy: () => void } | null = null;
    let cancelled = false;

    async function setup() {
      if (!video) return;
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = manifestUrl;
        return;
      }

      try {
        const Hls = (await import("hls.js")).default;
        if (Hls.isSupported()) {
          const instance = new Hls({
            enableWorker: true,
            xhrSetup(xhr) {
              xhr.withCredentials = true;
              xhr.setRequestHeader(STREAM_CLIENT_HEADER, STREAM_CLIENT_VALUE);
            },
          });
          instance.loadSource(manifestUrl);
          instance.attachMedia(video);
          hls = instance;
        } else {
          video.src = manifestUrl;
        }
      } catch {
        if (!cancelled) setError("HLS playback not supported");
      }
    }

    setup();
    return () => {
      cancelled = true;
      hls?.destroy();
    };
  }, [manifestUrl]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = speed;
  }, [speed]);

  useEffect(() => {
    if (!onHeartbeat) return;
    const interval = setInterval(() => {
      const v = videoRef.current;
      if (!v) return;
      onHeartbeat(
        Math.floor(v.currentTime),
        Math.floor(v.duration) || 1,
        !v.paused,
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [onHeartbeat]);

  return (
    <div>
      <video
        ref={videoRef}
        className="w-full max-w-3xl rounded bg-black"
        controls
        controlsList="nodownload"
        onContextMenu={(e) => e.preventDefault()}
      />
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        {SPEEDS.map((s) => (
          <button
            key={s}
            type="button"
            className={`rounded px-3 py-1 text-sm ${
              speed === s ? "bg-blue-600 text-white" : "bg-slate-700 text-slate-200"
            }`}
            onClick={() => setSpeed(s)}
          >
            {s}x
          </button>
        ))}
      </div>
    </div>
  );
}
