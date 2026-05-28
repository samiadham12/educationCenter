import { S3Client } from "@aws-sdk/client-s3";

let client: S3Client | null = null;

function normalizeR2Endpoint(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error("R2 endpoint is empty");
  if (trimmed.startsWith("http://")) {
    // Cloudflare R2 requires TLS. Using http:// often leads to TLS handshake errors later.
    throw new Error(
      "R2_ENDPOINT must start with https:// (Cloudflare R2 requires TLS)",
    );
  }
  if (!trimmed.startsWith("https://")) {
    throw new Error("R2_ENDPOINT must be a full https:// URL");
  }
  // Validate URL shape early for clearer errors.
  // eslint-disable-next-line no-new
  new URL(trimmed);
  return trimmed;
}

export function getR2Client(): S3Client {
  if (client) return client;

  const accountId = process.env.R2_ACCOUNT_ID!;
  const endpoint = normalizeR2Endpoint(
    process.env.R2_ENDPOINT ??
    `https://${accountId}.r2.cloudflarestorage.com`,
  );

  client = new S3Client({
    region: "auto",
    endpoint,
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });

  return client;
}
