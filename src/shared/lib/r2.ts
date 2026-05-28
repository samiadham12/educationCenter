import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { Readable } from "stream";
import { getR2Client } from "@/shared/lib/r2-client";

export type StorageProvider = "r2" | "local";

const R2_PLACEHOLDER_FRAGMENTS = [
  "your_cloudflare_account_id",
  "your_account_id",
  "your_r2_access_key",
  "your_r2_secret",
  "your_r2_secret_key",
  "change-me",
  "example.com",
];

function looksLikePlaceholder(value: string | undefined): boolean {
  if (!value?.trim()) return true;
  const normalized = value.trim().toLowerCase();
  return R2_PLACEHOLDER_FRAGMENTS.some((fragment) =>
    normalized.includes(fragment),
  );
}

export function isR2Configured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME,
  );
}

/** True only when R2 env vars look like real credentials (not .env.example placeholders). */
export function isR2Usable(): boolean {
  if (!isR2Configured()) return false;

  if (looksLikePlaceholder(process.env.R2_ACCOUNT_ID)) return false;
  if (looksLikePlaceholder(process.env.R2_ACCESS_KEY_ID)) return false;
  if (looksLikePlaceholder(process.env.R2_SECRET_ACCESS_KEY)) return false;
  if (looksLikePlaceholder(process.env.R2_BUCKET_NAME)) return false;
  if (looksLikePlaceholder(process.env.R2_ENDPOINT)) return false;

  return true;
}

export function isInvalidPresignedUploadUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return (
    !url.startsWith("https://") ||
    lower.includes("your_account_id") ||
    lower.includes("your_r2_") ||
    lower.includes("your_cloudflare") ||
    lower.includes("placeholder")
  );
}

export function getR2Bucket(): string {
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) throw new Error("R2_BUCKET_NAME is not configured");
  return bucket;
}

export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 300,
): Promise<string> {
  if (!isR2Usable()) {
    throw new Error("R2 is not configured");
  }
  const client = getR2Client();
  const command = new PutObjectCommand({
    Bucket: getR2Bucket(),
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(client, command, { expiresIn });
}

export async function getPresignedDownloadUrl(
  key: string,
  expiresIn?: number,
): Promise<string> {
  const client = getR2Client();
  const expiry =
    expiresIn ?? Number(process.env.R2_SIGNED_URL_EXPIRY_SECONDS ?? 900);
  const command = new GetObjectCommand({
    Bucket: getR2Bucket(),
    Key: key,
  });
  return getSignedUrl(client, command, { expiresIn: expiry });
}

export async function getR2Object(
  key: string,
): Promise<{ body: Readable; contentType?: string; contentLength?: number }> {
  const client = getR2Client();
  const response = await client.send(
    new GetObjectCommand({
      Bucket: getR2Bucket(),
      Key: key,
    }),
  );

  if (!response.Body) {
    throw new Error("Empty object body");
  }

  return {
    body: response.Body as Readable,
    contentType: response.ContentType,
    contentLength: response.ContentLength,
  };
}

export async function deleteR2Object(key: string): Promise<void> {
  const client = getR2Client();
  await client.send(
    new DeleteObjectCommand({
      Bucket: getR2Bucket(),
      Key: key,
    }),
  );
}
