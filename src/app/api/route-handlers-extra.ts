import mongoose from "mongoose";
import { connectMongo } from "@/shared/lib/mongodb";
import { jsonResponse, errorResponse } from "@/shared/utils/response";
import type { ApiContext } from "@/shared/types/api";
import { Media } from "@/features/media/models/Media.model";
import { LectureCode } from "@/features/lecture-codes/models/LectureCode.model";
import { Progress } from "@/features/progress-tracking/models/Progress.model";
import { User } from "@/features/users/models/User.model";
import {
  validateStreamAccess,
  getProxiedObject,
  hlsManifestExists,
} from "@/features/streaming/services/stream.service";
import { rewriteHlsPlaylistOpaque } from "@/features/streaming/services/playlist-rewrite";
import { flushProgressBuffer } from "@/features/progress-tracking/services/progress-buffer.service";
import { lectureCodeDefaults } from "@/shared/constants/lecture-code";
import { generateLectureCode } from "@/shared/utils/crypto";
import { signOut } from "@/features/auth/auth.config";
import { isValidOrigin } from "@/shared/utils/origin-guard";
import {
  isTrustedStreamRequest,
  streamClientGuardResponse,
} from "@/shared/utils/stream-client-guard";
import { checkRateLimit } from "@/shared/utils/rate-limit-key";
import { getMediaObject } from "@/shared/lib/media-storage";
import { AcademicYear } from "@/features/academic-years/models/AcademicYear.model";
import { Term } from "@/features/terms/models/Term.model";
import { Subject } from "@/features/subjects/models/Subject.model";
import { Section } from "@/features/sections/models/Section.model";
import { Lecture } from "@/features/lectures/models/Lecture.model";
import { ensureDefaultAcademicYears } from "@/features/academic-years/services/ensure-default-academic-years";
import { STAFF_ROLES } from "@/shared/constants/roles";

async function db(): Promise<void> {
  await connectMongo();
}

async function assertStreamPlayback(ctx: ApiContext, mediaId: string) {
  if (!ctx.user) {
    return { error: errorResponse("Unauthorized", 401) as Response };
  }
  if (!isTrustedStreamRequest(ctx.req)) {
    return { error: streamClientGuardResponse() };
  }
  const access = await validateStreamAccess(mediaId, ctx.user.id);
  if (!access) {
    return { error: errorResponse("Access denied", 403) as Response };
  }
  return { access };
}

export async function handleMediaLectureOptions(): Promise<Response> {
  await db();
  await ensureDefaultAcademicYears();

  const years = await AcademicYear.find().sort({ order: 1 }).lean();
  const lectures: Array<{
    id: string;
    label: string;
    yearId: string;
    termId: string;
    subjectId: string;
    sectionId: string;
  }> = [];

  for (const year of years) {
    const terms = await Term.find({ academicYearId: year._id })
      .sort({ order: 1 })
      .lean();
    for (const term of terms) {
      const subjects = await Subject.find({ termId: term._id }).lean();
      for (const subject of subjects) {
        const sections = await Section.find({ subjectId: subject._id })
          .sort({ order: 1 })
          .lean();
        for (const section of sections) {
          const sectionLectures = await Lecture.find({ sectionId: section._id })
            .sort({ createdAt: -1 })
            .lean();
          for (const lecture of sectionLectures) {
            lectures.push({
              id: String(lecture._id),
              label: `${year.name} › ${term.name} › ${subject.name} › ${section.name} › ${lecture.title}`,
              yearId: String(year._id),
              termId: String(term._id),
              subjectId: String(subject._id),
              sectionId: String(section._id),
            });
          }
        }
      }
    }
  }

  return jsonResponse({ lectures });
}

export async function handleLogout(): Promise<Response> {
  await signOut({ redirect: false });
  return jsonResponse({ success: true });
}

export async function handleListMedia(ctx: ApiContext): Promise<Response> {
  await db();
  const lectureId = ctx.query.get("lectureId");
  const isStudent = ctx.user?.role === "STUDENT";

  if (isStudent) {
    if (!lectureId) {
      return errorResponse("lectureId is required", 400);
    }
    if (!ctx.user) {
      return errorResponse("Unauthorized", 401);
    }
    const { canAccessLecture } = await import(
      "@/features/access-control/services/can-access-lecture"
    );
    const allowed = await canAccessLecture(ctx.user.id, lectureId, ctx.user.role);
    if (!allowed) {
      return errorResponse("Access denied", 403);
    }
  } else if (lectureId) {
    const { reconcilePendingMedia, reconcileFailedMedia } = await import(
      "@/features/media/services/media-upload.service"
    );
    await reconcilePendingMedia(lectureId);
    await reconcileFailedMedia(lectureId);
  }

  const filter: Record<string, unknown> = lectureId ? { lectureId } : {};
  if (isStudent) {
    // Show READY media plus video items that are still processing / failed.
    Object.assign(filter, {
      $or: [
        { uploadStatus: "READY" },
        {
          fileType: "VIDEO",
          uploadStatus: { $in: ["PROCESSING", "FAILED"] },
        },
      ],
    });
  }

  const media = await Media.find(filter).sort({ createdAt: -1 }).lean();
  return jsonResponse({ media });
}

export async function handleGetProgress(ctx: ApiContext): Promise<Response> {
  await db();
  if (!ctx.user) return errorResponse("Unauthorized", 401);
  const mediaId = ctx.segments[ctx.segments.length - 1];
  const progress = await Progress.findOne({
    userId: new mongoose.Types.ObjectId(ctx.user.id),
    mediaId: new mongoose.Types.ObjectId(mediaId),
  }).lean();
  return jsonResponse({ progress });
}

export async function handleLectureCodesByLecture(
  ctx: ApiContext,
): Promise<Response> {
  await db();
  const lectureId = ctx.segments[ctx.segments.length - 1];
  const codes = await LectureCode.find({ lectureId }).lean();
  return jsonResponse({ codes });
}

export async function handleRegenerateLectureCode(
  ctx: ApiContext,
): Promise<Response> {
  await db();
  const body = ctx.body as { lectureId: string };
  let code = generateLectureCode();
  let attempts = 0;
  while (attempts < 5) {
    const exists = await LectureCode.findOne({ code });
    if (!exists) break;
    code = generateLectureCode();
    attempts++;
  }

  const lectureCode = await LectureCode.findOneAndUpdate(
    { lectureId: body.lectureId },
    { code, ...lectureCodeDefaults() },
    { new: true, upsert: true },
  );

  return jsonResponse({ lectureCode });
}

export async function handleReprocessMedia(ctx: ApiContext): Promise<Response> {
  await db();
  if (!ctx.user) return errorResponse("Unauthorized", 401);
  if (!STAFF_ROLES.includes(ctx.user.role)) {
    return errorResponse("Forbidden", 403);
  }

  const mediaId = ctx.segments[ctx.segments.length - 2] || "";
  if (!mediaId) return errorResponse("Media not found", 404);

  const media = await Media.findById(mediaId);
  if (!media) return errorResponse("Media not found", 404);

  await Media.findByIdAndUpdate(mediaId, {
    uploadStatus: "PROCESSING",
    $unset: { hlsManifestKey: 1 },
  });

  const { processMediaAfterUpload } = await import(
    "@/features/media/services/transcode.service"
  );
  void processMediaAfterUpload(mediaId);

  return jsonResponse({ ok: true, mediaId, status: "PROCESSING" }, 202);
}

export async function handleStreamPlaylist(ctx: ApiContext): Promise<Response> {
  await db();
  if (!isValidOrigin(ctx.req)) {
    return errorResponse("Invalid origin", 403);
  }
  const mediaId = ctx.segments[ctx.segments.indexOf("stream") + 1];
  const gate = await assertStreamPlayback(ctx, mediaId);
  if (gate.error) return gate.error;
  const media = gate.access.media;
  const { storageProviderForKey } = await import("@/shared/lib/media-storage");
  const provider = storageProviderForKey(
    media.hlsManifestKey!,
    media.storageProvider ?? "r2",
  );

  if (!(await hlsManifestExists(media))) {
    return errorResponse("HLS manifest not available", 404);
  }

  try {
    const { body } = await getMediaObject(media.hlsManifestKey!, provider);
    const chunks: Buffer[] = [];
    for await (const c of body) chunks.push(Buffer.from(c));
    const text = Buffer.concat(chunks).toString("utf8");
    const rewritten = rewriteHlsPlaylistOpaque(text);
    return new Response(rewritten, {
      headers: {
        "Content-Type": "application/vnd.apple.mpegurl",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return errorResponse("HLS manifest not available", 404);
  }
}

/** Single URL for AES key + all segments (segment id in `X-Segment-Id` header only). */
export async function handleStreamChunk(ctx: ApiContext): Promise<Response> {
  await db();
  if (!isValidOrigin(ctx.req)) {
    return errorResponse("Invalid origin", 403);
  }
  const mediaId = ctx.segments[ctx.segments.indexOf("stream") + 1];
  const gate = await assertStreamPlayback(ctx, mediaId);
  if (gate.error) return gate.error;

  const part = ctx.req.headers.get("X-Stream-Part");
  if (part === "key") {
    return serveEncryptionKey(gate.access, mediaId);
  }
  if (part === "segment") {
    const segId = ctx.req.headers.get("X-Segment-Id");
    if (!segId?.trim()) {
      return errorResponse("Missing segment", 400);
    }
    return serveHlsSegmentFile(ctx, mediaId, segId.trim(), gate.access);
  }
  return errorResponse("Invalid stream request", 400);
}

type StreamAccess = NonNullable<Awaited<ReturnType<typeof validateStreamAccess>>>;

async function serveEncryptionKey(
  access: StreamAccess,
  mediaId: string,
): Promise<Response> {
  if (!checkRateLimit(`stream-key:${access.userId}:${mediaId}`, 30)) {
    return errorResponse("Key rate limit exceeded", 429);
  }

  const { storageProviderForKey } = await import("@/shared/lib/media-storage");
  const keyObjectKey = `hls/${mediaId}/enc.key`;
  const provider = storageProviderForKey(
    keyObjectKey,
    access.media.storageProvider ?? "r2",
  );

  try {
    const { body } = await getMediaObject(keyObjectKey, provider);
    const keyChunks: Buffer[] = [];
    for await (const c of body) keyChunks.push(Buffer.from(c));
    const keyBuf = Buffer.concat(keyChunks);
    if (keyBuf.length !== 16) {
      return errorResponse("Invalid encryption key", 500);
    }
    return new Response(keyBuf, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Cache-Control": "no-store, no-cache",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return errorResponse("Encryption key not found", 404);
  }
}

export async function handleStreamKey(ctx: ApiContext): Promise<Response> {
  await db();
  if (!isValidOrigin(ctx.req)) {
    return errorResponse("Invalid origin", 403);
  }
  const mediaId = ctx.segments[ctx.segments.indexOf("stream") + 1];
  const gate = await assertStreamPlayback(ctx, mediaId);
  if (gate.error) return gate.error;
  return serveEncryptionKey(gate.access, mediaId);
}

async function serveHlsSegmentFile(
  ctx: ApiContext,
  mediaId: string,
  segmentRef: string,
  prevalidated?: StreamAccess,
): Promise<Response> {
  let access = prevalidated;
  if (!access) {
    const gate = await assertStreamPlayback(ctx, mediaId);
    if (gate.error) return gate.error;
    access = gate.access;
  }

  if (
    !checkRateLimit(`stream-seg:${access.userId}:${mediaId}`, 120)
  ) {
    return errorResponse("Segment rate limit exceeded", 429);
  }

  const decoded = decodeURIComponent(segmentRef);
  const fileName = /\.ts$/i.test(decoded)
    ? decoded
    : /^seg_/i.test(decoded)
      ? `${decoded}.ts`
      : `seg_${decoded}.ts`;

  if (!/^[\w.-]+\.ts$/i.test(fileName)) {
    return errorResponse("Invalid segment", 400);
  }

  const key = `hls/${mediaId}/${fileName}`;
  const { storageProviderForKey } = await import("@/shared/lib/media-storage");
  const provider = storageProviderForKey(
    key,
    access.media.storageProvider ?? "r2",
  );

  try {
    return await getProxiedObject(key, provider);
  } catch {
    return errorResponse("Segment not found", 404);
  }
}

export async function handleStreamSegment(ctx: ApiContext): Promise<Response> {
  await db();
  if (!isValidOrigin(ctx.req)) {
    return errorResponse("Invalid origin", 403);
  }
  const streamIdx = ctx.segments.indexOf("stream");
  const mediaId = ctx.segments[streamIdx + 1];
  const seq = ctx.segments[streamIdx + 3];
  return serveHlsSegmentFile(ctx, mediaId, seq);
}

/** Playlist-relative URLs like /api/stream/:id/master0.ts (hls.js default). */
export async function handleStreamHlsDirect(ctx: ApiContext): Promise<Response> {
  await db();
  if (!isValidOrigin(ctx.req)) {
    return errorResponse("Invalid origin", 403);
  }
  const streamIdx = ctx.segments.indexOf("stream");
  const mediaId = ctx.segments[streamIdx + 1];
  const fileName = ctx.segments[streamIdx + 2];
  if (!fileName?.toLowerCase().endsWith(".ts")) {
    return errorResponse("Not found", 404);
  }
  return serveHlsSegmentFile(ctx, mediaId, fileName);
}

export async function handleStreamFile(ctx: ApiContext): Promise<Response> {
  await db();
  if (!isValidOrigin(ctx.req)) {
    return errorResponse("Invalid origin", 403);
  }
  const streamIdx = ctx.segments.indexOf("stream");
  const mediaId = ctx.segments[streamIdx + 1];
  const gate = await assertStreamPlayback(ctx, mediaId);
  if (gate.error) return gate.error;

  const media = gate.access.media;
  if (media.fileType === "VIDEO") {
    // Never allow direct video file downloads; video must be played via HLS playlist/segments.
    return errorResponse("Direct video file streaming is disabled", 403);
  }
  const provider = media.storageProvider ?? "r2";
  return await getProxiedObject(media.fileKey, provider);
}

export async function handleStreamPdf(ctx: ApiContext): Promise<Response> {
  await db();
  const mediaId = ctx.segments[ctx.segments.indexOf("pdf") + 1];
  const gate = await assertStreamPlayback(ctx, mediaId);
  if (gate.error) return gate.error;
  if (gate.access.media.fileType !== "PDF") {
    return errorResponse("Access denied", 403);
  }

  const response = await getProxiedObject(
    gate.access.media.fileKey,
    gate.access.media.storageProvider ?? "r2",
  );
  const headers = new Headers(response.headers);
  headers.set("Content-Disposition", "inline");
  headers.set("X-Frame-Options", "SAMEORIGIN");
  return new Response(response.body, { status: response.status, headers });
}

export async function handleAdminUsageExport(): Promise<Response> {
  await db();
  const rows = await Progress.find()
    .sort({ updatedAt: -1 })
    .limit(5000)
    .populate("userId", "name email")
    .populate("mediaId", "fileName fileType")
    .populate("lectureId", "title")
    .lean();

  const header =
    "Student,Email,Lecture,Media,Type,Minutes Watched,Completion %,Last Active\n";
  const lines = rows.map((r) => {
    const user = r.userId as { name?: string; email?: string } | null;
    const media = r.mediaId as { fileName?: string; fileType?: string } | null;
    const lecture = r.lectureId as { title?: string } | null;
    const minutes = ((r.watchedSeconds ?? 0) / 60).toFixed(2);
    return [
      user?.name ?? "",
      user?.email ?? "",
      lecture?.title ?? "",
      media?.fileName ?? "",
      media?.fileType ?? "",
      minutes,
      (r.completionPercent ?? 0).toFixed(1),
      r.updatedAt ? new Date(r.updatedAt).toISOString() : "",
    ]
      .map((c) => `"${String(c).replace(/"/g, '""')}"`)
      .join(",");
  });

  return new Response(header + lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="usage-export.csv"',
    },
  });
}

export async function handleFlushProgress(): Promise<Response> {
  const count = await flushProgressBuffer();
  return jsonResponse({ flushed: count });
}

export async function handleBulkStudents(ctx: ApiContext): Promise<Response> {
  await db();
  const body = ctx.body as {
    students: Array<{
      email: string;
      password: string;
      name: string;
      currentAcademicYearId: string;
      currentYearOrder: number;
    }>;
  };

  const created = [];
  const errors = [];

  for (const s of body.students) {
    try {
      const user = await User.create({
        email: s.email,
        passwordHash: s.password,
        name: s.name,
        role: "STUDENT",
        currentAcademicYearId: s.currentAcademicYearId,
        currentYearOrder: s.currentYearOrder,
      });
      created.push({ id: user._id, email: user.email });
    } catch (e) {
      errors.push({
        email: s.email,
        error: e instanceof Error ? e.message : "Failed",
      });
    }
  }

  return jsonResponse({ created, errors }, 201);
}

export async function handleDeleteUser(ctx: ApiContext): Promise<Response> {
  await db();
  const id = ctx.segments[ctx.segments.length - 1];
  await User.findByIdAndDelete(id);
  return jsonResponse({ deleted: true });
}
