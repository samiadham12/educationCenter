import type { Readable } from "stream";
import type { StorageProvider } from "@/shared/lib/r2";
import {
  deleteR2Object,
  getPresignedDownloadUrl,
  getR2Object,
  isR2Usable,
} from "@/shared/lib/r2";
import {
  deleteLocalFile,
  deleteLocalPrefix,
  getLocalFile,
  localFileExists,
  saveLocalFile,
} from "@/shared/lib/local-storage";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getR2Bucket } from "@/shared/lib/r2";
import { getR2Client } from "@/shared/lib/r2-client";

export function resolveUploadStorage(): StorageProvider {
  return isR2Usable() ? "r2" : "local";
}

/** HLS outputs are always stored locally and served via the API proxy. */
export function storageProviderForKey(
  key: string,
  fallback: StorageProvider = "r2",
): StorageProvider {
  if (key.startsWith("hls/")) return "local";
  return fallback;
}

export async function getMediaObject(
  key: string,
  provider: StorageProvider = "r2",
): Promise<{ body: Readable; contentType?: string; contentLength?: number }> {
  const effective = storageProviderForKey(key, provider);
  if (effective === "local" || (await localFileExists(key))) {
    return getLocalFile(key);
  }
  return getR2Object(key);
}

export async function putMediaObject(
  key: string,
  body: Buffer,
  contentType: string,
  provider: StorageProvider,
): Promise<void> {
  if (provider === "local") {
    await saveLocalFile(key, body);
    return;
  }
  await getR2Client().send(
    new PutObjectCommand({
      Bucket: getR2Bucket(),
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

export async function deleteMediaObject(
  key: string,
  provider: StorageProvider,
): Promise<void> {
  if (provider === "local") {
    await deleteLocalFile(key);
    return;
  }
  try {
    await deleteR2Object(key);
  } catch {
    if (await localFileExists(key)) {
      await deleteLocalFile(key);
    }
  }
}

export async function deleteMediaHls(
  mediaId: string,
  provider: StorageProvider,
): Promise<void> {
  const prefix = `hls/${mediaId}`;
  if (provider === "local") {
    await deleteLocalPrefix(prefix);
    return;
  }
  try {
    await deleteR2Object(`${prefix}/master.m3u8`);
  } catch {
    await deleteLocalPrefix(prefix);
  }
}

export { getPresignedDownloadUrl };
