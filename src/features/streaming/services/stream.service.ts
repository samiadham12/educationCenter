import { Media, type IMedia } from "@/features/media/models/Media.model";
import { canAccessLecture } from "@/features/access-control/services/can-access-lecture";
import { getMediaObject } from "@/shared/lib/media-storage";
import { localFileExists } from "@/shared/lib/local-storage";
import { Readable } from "stream";
import { rewriteHlsPlaylistOpaque } from "@/features/streaming/services/playlist-rewrite";

export async function hlsManifestExists(media: IMedia): Promise<boolean> {
  if (!media.hlsManifestKey) return false;
  if (await localFileExists(media.hlsManifestKey)) return true;
  const provider = media.storageProvider ?? "r2";
  if (provider === "local") return false;
  try {
    const { body } = await getMediaObject(media.hlsManifestKey, provider);
    body.destroy();
    return true;
  } catch {
    return false;
  }
}

export async function validateStreamAccess(
  mediaId: string,
  userId: string,
): Promise<{ media: IMedia; userId: string } | null> {
  const media = await Media.findById(mediaId);
  if (!media || media.uploadStatus !== "READY") return null;

  const allowed = await canAccessLecture(userId, media.lectureId.toString());
  if (!allowed) return null;

  return { media, userId };
}

export function streamToWebResponse(
  body: Readable,
  headers: Record<string, string>,
): Response {
  const webStream = Readable.toWeb(body) as ReadableStream;
  return new Response(webStream, { headers });
}

export async function getProxiedObject(
  key: string,
  provider: IMedia["storageProvider"] = "r2",
): Promise<Response> {
  const { body, contentType, contentLength } = await getMediaObject(
    key,
    provider,
  );
  const headers: Record<string, string> = {
    "Content-Type": contentType ?? "application/octet-stream",
    "Cache-Control": "no-store, no-cache",
    "X-Content-Type-Options": "nosniff",
  };
  if (contentLength) {
    headers["Content-Length"] = String(contentLength);
  }
  return streamToWebResponse(body, headers);
}

export async function fetchRewrittenHlsPlaylist(
  media: IMedia,
): Promise<string | null> {
  if (!media.hlsManifestKey || !(await hlsManifestExists(media))) {
    return null;
  }
  const { storageProviderForKey } = await import("@/shared/lib/media-storage");
  const provider = storageProviderForKey(
    media.hlsManifestKey,
    media.storageProvider ?? "r2",
  );
  try {
    const { body } = await getMediaObject(media.hlsManifestKey, provider);
    const chunks: Buffer[] = [];
    for await (const c of body) chunks.push(Buffer.from(c));
    const text = Buffer.concat(chunks).toString("utf8");
    return rewriteHlsPlaylistOpaque(text);
  } catch {
    return null;
  }
}

export function buildHlsPlaylist(
  mediaId: string,
  segmentCount = 10,
): string {
  const base = `/api/stream/${mediaId}/segment`;
  const lines = [
    "#EXTM3U",
    "#EXT-X-VERSION:3",
    "#EXT-X-TARGETDURATION:10",
    "#EXT-X-MEDIA-SEQUENCE:0",
  ];
  for (let i = 0; i < segmentCount; i++) {
    lines.push("#EXTINF:10.0,");
    lines.push(`${base}/${i}`);
  }
  lines.push("#EXT-X-ENDLIST");
  return lines.join("\n");
}
