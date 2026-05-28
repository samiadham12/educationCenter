import { createReadStream, existsSync } from "fs";
import { mkdir, unlink, writeFile, rm, stat } from "fs/promises";
import path from "path";
import type { Readable } from "stream";

// NOTE: This storage is used for protected assets (videos/HLS keys/segments).
// It must not live under `public/` to avoid bypassing API authorization.
const UPLOAD_ROOT = path.join(process.cwd(), "storage", "upload");
// Backwards-compat: older installs stored local uploads under `public/upload`.
const LEGACY_UPLOAD_ROOT = path.join(process.cwd(), "public", "upload");

export function getLocalUploadRoot(): string {
  return UPLOAD_ROOT;
}

function resolveLocalUploadPathInRoot(root: string, fileKey: string): string {
  const normalized = path.normalize(fileKey).replace(/^(\.\.(\/|\\|$))+/, "");
  const full = path.join(root, normalized);
  if (!full.startsWith(root)) {
    throw new Error("Invalid file key");
  }
  return full;
}

export function resolveLocalUploadPath(fileKey: string): string {
  return resolveLocalUploadPathInRoot(UPLOAD_ROOT, fileKey);
}

/** Prefer storage/upload, fall back to legacy public/upload when present. */
export function resolveExistingLocalPath(fileKey: string): string {
  const current = resolveLocalUploadPathInRoot(UPLOAD_ROOT, fileKey);
  if (existsSync(current)) return current;
  const legacy = resolveLocalUploadPathInRoot(LEGACY_UPLOAD_ROOT, fileKey);
  if (existsSync(legacy)) return legacy;
  return current;
}

export async function ensureLocalUploadDir(fileKey: string): Promise<string> {
  const filePath = resolveLocalUploadPath(fileKey);
  await mkdir(path.dirname(filePath), { recursive: true });
  return filePath;
}

export async function saveLocalFile(
  fileKey: string,
  data: Buffer,
): Promise<void> {
  const filePath = await ensureLocalUploadDir(fileKey);
  await writeFile(filePath, data);
}

export async function localFileExists(fileKey: string): Promise<boolean> {
  try {
    const current = resolveLocalUploadPathInRoot(UPLOAD_ROOT, fileKey);
    if (existsSync(current)) return true;
    const legacy = resolveLocalUploadPathInRoot(LEGACY_UPLOAD_ROOT, fileKey);
    return existsSync(legacy);
  } catch {
    return false;
  }
}

export async function getLocalFile(fileKey: string): Promise<{
  body: Readable;
  contentType?: string;
  contentLength?: number;
}> {
  const filePath = resolveExistingLocalPath(fileKey);
  const fileStat = await stat(filePath);
  const ext = path.extname(fileKey).toLowerCase();
  const contentType = guessMimeFromExt(ext);
  return {
    body: createReadStream(filePath),
    contentType,
    contentLength: fileStat.size,
  };
}

export async function deleteLocalFile(fileKey: string): Promise<void> {
  const current = resolveLocalUploadPathInRoot(UPLOAD_ROOT, fileKey);
  if (existsSync(current)) await unlink(current);
  const legacy = resolveLocalUploadPathInRoot(LEGACY_UPLOAD_ROOT, fileKey);
  if (existsSync(legacy)) await unlink(legacy);
}

export async function deleteLocalPrefix(prefix: string): Promise<void> {
  const currentDir = resolveLocalUploadPathInRoot(UPLOAD_ROOT, prefix);
  if (existsSync(currentDir)) await rm(currentDir, { recursive: true, force: true });
  const legacyDir = resolveLocalUploadPathInRoot(LEGACY_UPLOAD_ROOT, prefix);
  if (existsSync(legacyDir)) await rm(legacyDir, { recursive: true, force: true });
}

function guessMimeFromExt(ext: string): string | undefined {
  const map: Record<string, string> = {
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".mov": "video/quicktime",
    ".mp3": "audio/mpeg",
    ".m4a": "audio/mp4",
    ".wav": "audio/wav",
    ".pdf": "application/pdf",
    ".m3u8": "application/vnd.apple.mpegurl",
    ".ts": "video/mp2t",
  };
  return map[ext];
}
