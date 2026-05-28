import { execFile } from "child_process";
import { promisify } from "util";
import { existsSync } from "fs";
import { mkdir, rm, readFile, readdir, writeFile } from "fs/promises";
import path from "path";
import os from "os";
import { randomBytes } from "crypto";
import { Media } from "@/features/media/models/Media.model";
import { getMediaObject, putMediaObject } from "@/shared/lib/media-storage";
import {
  localFileExists,
  resolveExistingLocalPath,
} from "@/shared/lib/local-storage";
import type { MediaStorageProvider } from "@/features/media/models/Media.model";

const execFileAsync = promisify(execFile);

/** Resolve FFmpeg binary: FFMPEG_PATH env → bundled ffmpeg-static → `ffmpeg` on PATH. */
export function resolveFfmpegBinary(): string {
  const configured = process.env.FFMPEG_PATH?.trim();
  if (configured && configured !== "ffmpeg" && existsSync(configured)) return configured;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const bundled = require("ffmpeg-static") as string | null | undefined;
    if (bundled && typeof bundled === "string" && existsSync(bundled)) return bundled;
  } catch {
    // optional dependency not installed
  }

  // Next.js bundling can sometimes rewrite the returned path to `.next/.../ffmpeg.exe`.
  // Prefer the real node_modules binary if present.
  const fallbackCandidates =
    process.platform === "win32"
      ? [
          path.join(process.cwd(), "node_modules", "ffmpeg-static", "ffmpeg.exe"),
          path.join(process.cwd(), "node_modules", "ffmpeg-static", "bin", "ffmpeg.exe"),
        ]
      : [
          path.join(process.cwd(), "node_modules", "ffmpeg-static", "ffmpeg"),
          path.join(process.cwd(), "node_modules", "ffmpeg-static", "bin", "ffmpeg"),
        ];
  for (const c of fallbackCandidates) {
    if (existsSync(c)) return c;
  }

  return configured || "ffmpeg";
}

export async function ffmpegAvailable(): Promise<boolean> {
  const bin = resolveFfmpegBinary();
  try {
    await execFileAsync(bin, ["-version"]);
    return true;
  } catch {
    return false;
  }
}

export async function processMediaAfterUpload(mediaId: string): Promise<void> {
  const media = await Media.findById(mediaId);
  if (!media) return;

  const storageProvider: MediaStorageProvider =
    media.storageProvider ?? "r2";

  media.uploadStatus = "PROCESSING";
  await media.save();

  const hlsBase = `hls/${mediaId}`;
  const manifestKey = `${hlsBase}/master.m3u8`;
  const encryptionKeyKey = `${hlsBase}/enc.key`;

  try {
    const hasFfmpeg = await ffmpegAvailable();

    if (!hasFfmpeg || media.fileType === "PDF" || media.fileType === "AUDIO") {
      const fileOk =
        storageProvider === "local"
          ? await localFileExists(media.fileKey)
          : true;
      if (!fileOk) {
        throw new Error("Uploaded file missing on server");
      }
      // No ffmpeg → serve the original file directly (no fake HLS manifest).
      media.hlsManifestKey = undefined;
      media.hlsEncrypted = false;
      media.uploadStatus = "READY";
      await media.save();
      return;
    }

    const tmpDir = path.join(os.tmpdir(), `edu-${mediaId}`);
    await mkdir(tmpDir, { recursive: true });
    const inputPath = path.join(tmpDir, "input");
    const outputDir = path.join(tmpDir, "out");

    if (await localFileExists(media.fileKey)) {
      const localPath = resolveExistingLocalPath(media.fileKey);
      const { copyFile } = await import("fs/promises");
      await copyFile(localPath, inputPath);
    } else {
      const { body } = await getMediaObject(media.fileKey, storageProvider);
      const chunks: Buffer[] = [];
      for await (const chunk of body) {
        chunks.push(Buffer.from(chunk));
      }
      await writeFile(inputPath, Buffer.concat(chunks));
    }

    await mkdir(outputDir, { recursive: true });

    const segmentDuration = process.env.HLS_SEGMENT_DURATION ?? "10";
    const ffmpeg = resolveFfmpegBinary();

    // AES-128 (HLS) encryption: store the key server-side and only expose it via API.
    const hlsKey = randomBytes(16);
    const hlsIv = randomBytes(16).toString("hex");
    const keyPath = path.join(tmpDir, "enc.key");
    const keyInfoPath = path.join(tmpDir, "key_info.txt");
    await writeFile(keyPath, hlsKey);
    // key_info format:
    // 1) Key URI in playlist
    // 2) Local path to the key file (16 bytes)
    // 3) Optional IV in hex (without 0x prefix)
    //
    // Playlist/key URIs are rewritten at request time to protected API paths (session + client header).
    await writeFile(keyInfoPath, [`enc.key`, keyPath, hlsIv].join("\n"));

    const segmentPattern = path.join(outputDir, "seg_%d.ts");
    await execFileAsync(ffmpeg, [
      "-i",
      inputPath,
      "-codec:",
      "copy",
      "-start_number",
      "0",
      "-hls_time",
      segmentDuration,
      "-hls_list_size",
      "0",
      "-hls_segment_filename",
      segmentPattern,
      "-hls_key_info_file",
      keyInfoPath,
      "-f",
      "hls",
      path.join(outputDir, "master.m3u8"),
    ]);

    const files = await readdir(outputDir);
    // HLS is always stored locally (served through /api/stream); source file may stay on R2.
    const hlsProvider: MediaStorageProvider = "local";
    for (const file of files) {
      const buf = await readFile(path.join(outputDir, file));
      const key = `${hlsBase}/${file}`;
      const ct = file.endsWith(".m3u8")
        ? "application/vnd.apple.mpegurl"
        : "video/mp2t";
      await putMediaObject(key, buf, ct, hlsProvider);
    }

    media.hlsManifestKey = manifestKey;
    media.hlsEncrypted = true;
    media.uploadStatus = "READY";
    await media.save();

    await putMediaObject(
      encryptionKeyKey,
      hlsKey,
      "application/octet-stream",
      hlsProvider,
    );
    await rm(tmpDir, { recursive: true, force: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Transcode failed:", msg, err);
    media.uploadStatus = "FAILED";
    await media.save();
  }
}
