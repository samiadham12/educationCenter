import Hls, { type HlsConfig, type Loader, type LoaderCallbacks, type LoaderConfiguration, type LoaderContext, type LoaderStats } from "hls.js";
import {
  STREAM_CLIENT_HEADER,
  STREAM_CLIENT_VALUE,
} from "./stream-client";

function emptyStats(): LoaderStats {
  return {
    aborted: false,
    loaded: 0,
    retry: 0,
    total: 0,
    chunkCount: 0,
    bwEstimate: 0,
    loading: { start: 0, first: 0, end: 0 },
    parsing: { start: 0, end: 0 },
    buffering: { start: 0, first: 0, end: 0 },
  };
}

function isKeyContext(
  context: LoaderContext,
): context is LoaderContext & { keyInfo: unknown } {
  return "keyInfo" in context && Boolean((context as { keyInfo?: unknown }).keyInfo);
}

/** One network URL for keys + all segments; segment id only in a request header. */
export function createSecureHlsLoader(mediaId: string): typeof Hls.DefaultConfig.loader {
  const BaseLoader = Hls.DefaultConfig.loader;

  return class SecureStreamLoader
    extends BaseLoader
    implements Loader<LoaderContext>
  {
    private readonly mediaId = mediaId;

    load(
      context: LoaderContext,
      config: LoaderConfiguration,
      callbacks: LoaderCallbacks<LoaderContext>,
    ): void {
      const url = context.url;
      const isChunk =
        isKeyContext(context) ||
        ("frag" in context &&
          Boolean((context as { frag?: { sn?: number } }).frag) &&
          (url.endsWith("/c") ||
            url === "c" ||
            /\/c(\?|$)/.test(url) ||
            url.startsWith("blob:")));

      if (!isChunk) {
        super.load(context, config, callbacks);
        return;
      }

      const stats = emptyStats();
      stats.loading.start = performance.now();

      const headers: Record<string, string> = {
        [STREAM_CLIENT_HEADER]: STREAM_CLIENT_VALUE,
      };

      if (isKeyContext(context)) {
        headers["X-Stream-Part"] = "key";
      } else {
        const frag = (context as { frag: { sn: number } }).frag;
        headers["X-Stream-Part"] = "segment";
        headers["X-Segment-Id"] = `seg_${frag.sn}`;
      }

      const chunkUrl = `/api/stream/${this.mediaId}/chunk`;

      fetch(chunkUrl, { credentials: "include", headers, cache: "no-store" })
        .then(async (res) => {
          if (!res.ok) {
            throw new Error(res.statusText || `HTTP ${res.status}`);
          }
          const data = await res.arrayBuffer();
          stats.loaded = data.byteLength;
          stats.total = data.byteLength;
          stats.loading.end = performance.now();
          stats.loading.first = stats.loading.end;
          callbacks.onSuccess(
            { url: chunkUrl, data },
            stats,
            context,
            null,
          );
        })
        .catch((err: Error) => {
          stats.loading.end = performance.now();
          callbacks.onError(
            { code: 0, text: err.message },
            context,
            null,
            stats,
          );
        });
    }
  };
}

export function createSecureHls(
  mediaId: string,
  extra?: Partial<HlsConfig>,
): Hls {
  const LoaderClass = createSecureHlsLoader(mediaId);
  return new Hls({
    enableWorker: true,
    loader: LoaderClass,
    fLoader: LoaderClass,
    ...extra,
  });
}

export function hlsPlaylistBlobUrl(playlistText: string): string {
  const blob = new Blob([playlistText], {
    type: "application/vnd.apple.mpegurl",
  });
  return URL.createObjectURL(blob);
}
