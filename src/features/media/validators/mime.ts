const ALLOWED: Record<string, string[]> = {
  VIDEO: ["video/mp4", "video/webm", "video/quicktime"],
  AUDIO: ["audio/mpeg", "audio/mp4", "audio/wav", "audio/x-wav"],
  PDF: ["application/pdf"],
};

const MAX_BYTES: Record<string, number> = {
  VIDEO: Number(process.env.MAX_VIDEO_UPLOAD_BYTES ?? 2147483648),
  AUDIO: Number(process.env.MAX_AUDIO_UPLOAD_BYTES ?? 524288000),
  PDF: Number(process.env.MAX_PDF_UPLOAD_BYTES ?? 52428800),
};

export function validateMediaUpload(
  fileType: string,
  mimeType: string,
  fileSize: number,
): { ok: true } | { ok: false; error: string } {
  const allowed = ALLOWED[fileType];
  if (!allowed) return { ok: false, error: "Invalid file type" };
  if (!allowed.includes(mimeType)) {
    return { ok: false, error: `MIME type ${mimeType} not allowed for ${fileType}` };
  }
  const max = MAX_BYTES[fileType];
  if (fileSize > max) {
    return { ok: false, error: `File exceeds max size for ${fileType}` };
  }
  return { ok: true };
}
