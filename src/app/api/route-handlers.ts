import mongoose from "mongoose";
import { connectMongo } from "@/shared/lib/mongodb";
import { jsonResponse, errorResponse } from "@/shared/utils/response";
import type { ApiContext } from "@/shared/types/api";
import { User } from "@/features/users/models/User.model";
import { AcademicYear } from "@/features/academic-years/models/AcademicYear.model";
import { Term } from "@/features/terms/models/Term.model";
import { Subject } from "@/features/subjects/models/Subject.model";
import { Section } from "@/features/sections/models/Section.model";
import { Lecture } from "@/features/lectures/models/Lecture.model";
import { Media } from "@/features/media/models/Media.model";
import { LectureCode } from "@/features/lecture-codes/models/LectureCode.model";
import { LectureCodeUsage } from "@/features/lecture-codes/models/LectureCodeUsage.model";
import { Subscription } from "@/features/subscriptions/models/Subscription.model";
import { Progress } from "@/features/progress-tracking/models/Progress.model";
import { AuditLog } from "@/features/auth/models/AuditLog.model";
import { canAccessLecture } from "@/features/access-control/services/can-access-lecture";
import { promoteAllStudents } from "@/features/academic-years/services/promotion.service";
import {
  getPresignedUploadUrl,
  isInvalidPresignedUploadUrl,
} from "@/shared/lib/r2";
import {
  resolveUploadStorage,
  deleteMediaHls,
  deleteMediaObject,
} from "@/shared/lib/media-storage";
import { saveLocalFile } from "@/shared/lib/local-storage";
import type { MediaStorageProvider } from "@/features/media/models/Media.model";
import { cacheGet, cacheSet, cacheDel } from "@/shared/lib/redis";
import { auth, signIn } from "@/features/auth/auth.config";
import { validateMediaUpload } from "@/features/media/validators/mime";
import { bufferProgressHeartbeat } from "@/features/progress-tracking/services/progress-buffer.service";
import { invalidateHierarchyCache } from "@/features/academic-years/services/hierarchy-cache.service";
import { ensureDefaultAcademicYears } from "@/features/academic-years/services/ensure-default-academic-years";
import { ErrorCodes } from "@/shared/constants/error-codes";
import { getDefaultLocale } from "@/shared/i18n/locales";
import { OneTimeLectureLink } from "@/features/one-time-links/models/OneTimeLectureLink.model";
import { STAFF_ROLES } from "@/shared/constants/roles";
import { createHmac, randomBytes } from "crypto";

async function db(): Promise<void> {
  await connectMongo();
}

function hashOneTimeToken(token: string): string {
  const secret = process.env.APP_SECRET ?? "dev-secret";
  return createHmac("sha256", secret).update(token).digest("hex");
}

function generateOneTimeToken(): string {
  return randomBytes(24).toString("base64url");
}

export async function handleHealth(): Promise<Response> {
  let dbConnected = false;
  let dbError: string | undefined;
  try {
    await connectMongo();
    dbConnected = true;
  } catch (err) {
    dbError = err instanceof Error ? err.message : "Database connection failed";
  }
  const { ffmpegAvailable, resolveFfmpegBinary } = await import(
    "@/features/media/services/transcode.service"
  );
  const ffmpeg = await ffmpegAvailable();
  return jsonResponse({
    status: dbConnected && ffmpeg ? "ok" : "degraded",
    db: dbConnected,
    ffmpeg,
    ffmpegPath: resolveFfmpegBinary(),
    ...(dbError ? { dbError } : {}),
    timestamp: new Date().toISOString(),
  });
}

export async function handleLogin(ctx: ApiContext): Promise<Response> {
  const body = ctx.body as { email?: string; password?: string };
  if (!body?.email || !body?.password) {
    return errorResponse(
      "Email and password required",
      400,
      ErrorCodes.AUTH_EMAIL_PASSWORD_REQUIRED,
    );
  }

  await db();
  const user = await User.findOne({
    email: body.email.toLowerCase(),
    isActive: true,
  }).select("+passwordHash");

  if (!user?.passwordHash) {
    return errorResponse(
      "Invalid credentials",
      401,
      ErrorCodes.AUTH_INVALID_CREDENTIALS,
    );
  }

  const bcrypt = await import("bcryptjs");
  const valid = await bcrypt.compare(body.password, user.passwordHash);
  if (!valid) {
    return errorResponse(
      "Invalid credentials",
      401,
      ErrorCodes.AUTH_INVALID_CREDENTIALS,
    );
  }

  const result = await signIn("credentials", {
    email: body.email,
    password: body.password,
    redirect: false,
  });

  if (result && typeof result === "object" && "error" in result && result.error) {
    return errorResponse(
      "Invalid credentials",
      401,
      ErrorCodes.AUTH_INVALID_CREDENTIALS,
    );
  }

  const session = await auth();
  return jsonResponse({ success: true, user: session?.user });
}

export async function handleSession(): Promise<Response> {
  const session = await auth();
  if (!session?.user) {
    return errorResponse("Unauthorized", 401, ErrorCodes.AUTH_UNAUTHORIZED);
  }
  return jsonResponse({ user: session.user });
}

export async function handleSignupYears(): Promise<Response> {
  await db();
  await ensureDefaultAcademicYears();
  const years = await AcademicYear.find({ isActive: true })
    .sort({ order: 1 })
    .select("name order")
    .lean();
  return jsonResponse({ years });
}

export async function handleSignup(ctx: ApiContext): Promise<Response> {
  const body = ctx.body as {
    email?: string;
    password?: string;
    name?: string;
    currentAcademicYearId?: string;
  };

  if (!body?.email || !body?.password || !body?.name) {
    return errorResponse(
      "Name, email, and password are required",
      400,
      ErrorCodes.AUTH_SIGNUP_FIELDS_REQUIRED,
    );
  }

  if (body.password.length < 8) {
    return errorResponse(
      "Password must be at least 8 characters",
      400,
      ErrorCodes.AUTH_PASSWORD_TOO_SHORT,
    );
  }

  await db();
  await ensureDefaultAcademicYears();

  const email = body.email.toLowerCase().trim();
  const exists = await User.findOne({ email });
  if (exists) {
    return errorResponse(
      "Email already registered",
      409,
      ErrorCodes.AUTH_EMAIL_REGISTERED,
    );
  }

  let year = body.currentAcademicYearId
    ? await AcademicYear.findOne({
        _id: body.currentAcademicYearId,
        isActive: true,
      })
    : null;

  if (!year) {
    year = await AcademicYear.findOne({ isActive: true }).sort({ order: 1 });
  }

  if (!year) {
    return errorResponse(
      "Registration is not available. No academic year configured.",
      503,
      ErrorCodes.AUTH_SIGNUP_NO_YEAR,
    );
  }

  const user = await User.create({
    email,
    passwordHash: body.password,
    name: body.name.trim(),
    role: "STUDENT",
    currentAcademicYearId: year._id,
    currentYearOrder: year.order,
    preferredLocale: ctx.locale ?? getDefaultLocale(),
  });

  const result = await signIn("credentials", {
    email,
    password: body.password,
    redirect: false,
  });

  if (result && typeof result === "object" && "error" in result && result.error) {
    return jsonResponse(
      {
        success: true,
        message: "Account created. Please sign in.",
        user: { id: user._id, email: user.email, name: user.name },
      },
      201,
    );
  }

  const session = await auth();
  return jsonResponse(
    {
      success: true,
      user: session?.user ?? {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
      },
    },
    201,
  );
}

export async function handleCreateStaff(ctx: ApiContext): Promise<Response> {
  await db();
  const body = ctx.body as {
    email: string;
    password: string;
    name: string;
    role: "ADMIN" | "MODERATOR";
  };
  const exists = await User.findOne({ email: body.email.toLowerCase() });
  if (exists) return errorResponse("Email already exists", 409);

  const user = await User.create({
    email: body.email,
    passwordHash: body.password,
    name: body.name,
    role: body.role,
  });

  return jsonResponse(
    {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    201,
  );
}

export async function handleCreateStudent(ctx: ApiContext): Promise<Response> {
  await db();
  const body = ctx.body as {
    email: string;
    password: string;
    name: string;
    currentAcademicYearId: string;
    currentYearOrder: number;
  };

  const user = await User.create({
    email: body.email,
    passwordHash: body.password,
    name: body.name,
    role: "STUDENT",
    currentAcademicYearId: body.currentAcademicYearId,
    currentYearOrder: body.currentYearOrder,
  });

  return jsonResponse({ id: user._id, email: user.email }, 201);
}

export async function handleListUsers(ctx: ApiContext): Promise<Response> {
  await db();
  const roleFilter = ctx.query.get("role");
  const filter: Record<string, unknown> = {};
  if (roleFilter) {
    filter.role = { $in: roleFilter.split(",") };
  }
  const users = await User.find(filter)
    .select("-passwordHash")
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();
  return jsonResponse({ users });
}

export async function handlePatchUser(ctx: ApiContext): Promise<Response> {
  await db();
  const id = ctx.segments[ctx.segments.length - 1];
  const body = ctx.body as Record<string, unknown>;
  const user = await User.findByIdAndUpdate(id, body, { new: true }).select(
    "-passwordHash",
  );
  if (!user) return errorResponse("User not found", 404);
  return jsonResponse({ user });
}

export async function handleAcademicYears(
  ctx: ApiContext,
): Promise<Response> {
  await db();
  if (ctx.method === "GET") {
    await ensureDefaultAcademicYears();
    const years = await AcademicYear.find().sort({ order: 1 }).lean();
    return jsonResponse({ academicYears: years });
  }
  if (ctx.method === "POST") {
    const body = ctx.body as { name: string; order: number };
    const existing = await AcademicYear.findOne({ order: body.order });
    if (existing) {
      return errorResponse(
        `Academic year with order ${body.order} already exists`,
        409,
      );
    }
    const year = await AcademicYear.create({
      name: body.name,
      order: body.order,
      isActive: true,
    });
    await invalidateHierarchyCache();
    return jsonResponse({ academicYear: year.toObject() }, 201);
  }
  if (ctx.method === "PUT") {
    const id = ctx.segments[ctx.segments.length - 1];
    const year = await AcademicYear.findByIdAndUpdate(id, ctx.body as object, {
      new: true,
    });
    return jsonResponse({ academicYear: year });
  }
  if (ctx.method === "DELETE") {
    const id = ctx.segments[ctx.segments.length - 1];
    await AcademicYear.findByIdAndDelete(id);
    return jsonResponse({ deleted: true });
  }
  return errorResponse("Method not allowed", 405);
}

export async function handleTerms(ctx: ApiContext): Promise<Response> {
  await db();
  const yearId = ctx.query.get("academicYearId");
  if (ctx.method === "GET") {
    const filter = yearId
      ? { academicYearId: yearId }
      : {};
    const terms = await Term.find(filter).sort({ order: 1 }).lean();
    return jsonResponse({ terms });
  }
  if (ctx.method === "POST") {
    const term = await Term.create(ctx.body);
    return jsonResponse({ term }, 201);
  }
  if (ctx.method === "PUT") {
    const id = ctx.segments[ctx.segments.length - 1];
    const term = await Term.findByIdAndUpdate(id, ctx.body as object, { new: true });
    return jsonResponse({ term });
  }
  if (ctx.method === "DELETE") {
    const id = ctx.segments[ctx.segments.length - 1];
    await Term.findByIdAndDelete(id);
    return jsonResponse({ deleted: true });
  }
  return errorResponse("Method not allowed", 405);
}

export async function handleSubjects(ctx: ApiContext): Promise<Response> {
  await db();
  const termId = ctx.query.get("termId");
  if (ctx.method === "GET") {
    const filter = termId ? { termId } : {};
    const subjects = await Subject.find(filter).lean();
    return jsonResponse({ subjects });
  }
  if (ctx.method === "POST") {
    const subject = await Subject.create(ctx.body);
    return jsonResponse({ subject }, 201);
  }
  if (ctx.method === "PUT") {
    const id = ctx.segments[ctx.segments.length - 1];
    const subject = await Subject.findByIdAndUpdate(id, ctx.body as object, {
      new: true,
    });
    return jsonResponse({ subject });
  }
  if (ctx.method === "DELETE") {
    const id = ctx.segments[ctx.segments.length - 1];
    await Subject.findByIdAndDelete(id);
    return jsonResponse({ deleted: true });
  }
  return errorResponse("Method not allowed", 405);
}

export async function handleSections(ctx: ApiContext): Promise<Response> {
  await db();
  const subjectId = ctx.query.get("subjectId");
  const filter = subjectId ? { subjectId } : {};
  const sections = await Section.find(filter).sort({ order: 1 }).lean();
  return jsonResponse({ sections });
}

export async function handleLectures(ctx: ApiContext): Promise<Response> {
  await db();
  const sectionId = ctx.query.get("sectionId");
  if (ctx.method === "GET") {
    const filter = sectionId ? { sectionId } : {};
    const lectures = await Lecture.find(filter).sort({ createdAt: -1 }).lean();
    const codes = await LectureCode.find({
      lectureId: { $in: lectures.map((l) => l._id) },
    }).lean();
    return jsonResponse({ lectures, codes });
  }
  if (ctx.method === "POST") {
    const lecture = await Lecture.create(ctx.body);
    const code = await LectureCode.findOne({ lectureId: lecture._id }).lean();
    return jsonResponse({ lecture, code }, 201);
  }
  if (ctx.method === "PUT") {
    const id = ctx.segments[ctx.segments.length - 1];
    const lecture = await Lecture.findByIdAndUpdate(id, ctx.body as object, {
      new: true,
    });
    return jsonResponse({ lecture });
  }
  if (ctx.method === "DELETE") {
    const id = ctx.segments[ctx.segments.length - 1];
    await Lecture.findByIdAndDelete(id);
    return jsonResponse({ deleted: true });
  }
  return errorResponse("Method not allowed", 405);
}

export async function handleMediaPresign(ctx: ApiContext): Promise<Response> {
  await db();
  const body = ctx.body as {
    lectureId: string;
    fileName: string;
    fileType: string;
    mimeType: string;
    fileSize: number;
  };

  const validation = validateMediaUpload(
    body.fileType,
    body.mimeType,
    body.fileSize ?? 0,
  );
  if (!validation.ok) return errorResponse(validation.error, 400);

  const fileKey = `${body.fileType.toLowerCase()}s/${body.lectureId}/${Date.now()}-${body.fileName}`;
  let storageProvider: MediaStorageProvider = resolveUploadStorage();
  let uploadUrl = "/api/media/upload";

  if (storageProvider === "r2") {
    try {
      const presigned = await getPresignedUploadUrl(fileKey, body.mimeType);
      if (isInvalidPresignedUploadUrl(presigned)) {
        storageProvider = "local";
        uploadUrl = "/api/media/upload";
      } else {
        uploadUrl = presigned;
      }
    } catch {
      storageProvider = "local";
      uploadUrl = "/api/media/upload";
    }
  }

  if (uploadUrl.startsWith("/api/media/upload")) {
    storageProvider = "local";
  }

  const media = await Media.create({
    fileName: body.fileName,
    fileKey,
    fileType: body.fileType,
    mimeType: body.mimeType,
    lectureId: body.lectureId,
    uploadStatus: "PENDING",
    storageProvider,
  });

  return jsonResponse({
    mediaId: media._id,
    uploadUrl,
    fileKey,
    storage: storageProvider,
    expiresAt:
      storageProvider === "r2"
        ? new Date(Date.now() + 300_000).toISOString()
        : undefined,
  });
}

export async function handleMediaLocalUpload(
  ctx: ApiContext,
): Promise<Response> {
  await db();
  const mediaId = ctx.query.get("mediaId");
  if (!mediaId) return errorResponse("mediaId is required", 400);

  const media = await Media.findById(mediaId);
  if (!media) return errorResponse("Media not found", 404);

  // This route only ever writes to local storage — align DB with actual storage
  if (media.storageProvider !== "local") {
    media.storageProvider = "local";
    await media.save();
  }

  let formData: FormData;
  try {
    formData = await ctx.req.formData();
  } catch {
    return errorResponse("Invalid multipart form data", 400);
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return errorResponse("file is required", 400);
  }

  const validation = validateMediaUpload(
    media.fileType,
    file.type || media.mimeType,
    file.size,
  );
  if (!validation.ok) return errorResponse(validation.error, 400);

  const buffer = Buffer.from(await file.arrayBuffer());
  await saveLocalFile(media.fileKey, buffer);

  return jsonResponse({
    mediaId: media._id,
    storage: "local",
    message: "File saved to project storage (local)",
  });
}

export async function handleMediaConfirm(ctx: ApiContext): Promise<Response> {
  await db();
  const body = ctx.body as { mediaId: string; durationSeconds?: number };
  const existing = await Media.findById(body.mediaId);
  if (!existing) return errorResponse("Media not found", 404);

  if (existing.uploadStatus === "READY") {
    return jsonResponse({ media: existing, message: "Already ready" });
  }

  const { uploadedMediaFileExists } = await import(
    "@/features/media/services/media-upload.service"
  );
  const fileExists = await uploadedMediaFileExists(existing);
  if (!fileExists) {
    await Media.findByIdAndUpdate(existing._id, { uploadStatus: "FAILED" });
    return errorResponse(
      "Upload file not found. Please upload the file again.",
      400,
    );
  }

  const media = await Media.findByIdAndUpdate(
    body.mediaId,
    {
      uploadStatus: "PROCESSING",
      durationSeconds: body.durationSeconds,
    },
    { new: true },
  );
  if (media) {
    const { processMediaAfterUpload } = await import(
      "@/features/media/services/transcode.service"
    );
    void processMediaAfterUpload(media._id.toString());
  }
  return jsonResponse({ media, message: "Processing started" });
}

export async function handleRedeemCode(ctx: ApiContext): Promise<Response> {
  await db();
  if (!ctx.user) return errorResponse("Unauthorized", 401);

  const { checkRateLimit } = await import("@/shared/utils/rate-limit-key");
  const maxAttempts = Number(
    process.env.LECTURE_CODE_MAX_ATTEMPTS_PER_MINUTE ?? 5,
  );
  if (
    !checkRateLimit(
      `lecture-redeem:${ctx.ip}`,
      maxAttempts,
    )
  ) {
    return errorResponse("Too many code attempts", 429);
  }

  const body = ctx.body as { code: string };
  const code = body.code.toUpperCase().trim();

  const lectureCode = await LectureCode.findOne({
    code,
    isActive: true,
  });

  if (!lectureCode) return errorResponse("Invalid code", 404);
  if (lectureCode.expiresAt && lectureCode.expiresAt < new Date()) {
    return errorResponse("Code expired", 410);
  }
  const existing = await LectureCodeUsage.findOne({
    userId: ctx.user.id,
    lectureId: lectureCode.lectureId,
  });
  if (existing) {
    return jsonResponse({
      success: true,
      lectureId: lectureCode.lectureId,
      message: "Already redeemed",
    });
  }

  if (lectureCode.maxUses !== null) {
    const reserved = await LectureCode.findOneAndUpdate(
      {
        _id: lectureCode._id,
        isActive: true,
        usedCount: { $lt: lectureCode.maxUses },
      },
      {
        $inc: { usedCount: 1 },
        ...(lectureCode.usedCount + 1 >= lectureCode.maxUses
          ? { isActive: false }
          : {}),
      },
      { new: true },
    );
    if (!reserved) {
      return errorResponse("Code usage limit reached", 410);
    }
  } else {
    await LectureCode.findByIdAndUpdate(lectureCode._id, {
      $inc: { usedCount: 1 },
    });
  }

  try {
    await LectureCodeUsage.create({
      userId: ctx.user.id,
      lectureCodeId: lectureCode._id,
      lectureId: lectureCode.lectureId,
    });
  } catch (err) {
    await LectureCode.findByIdAndUpdate(lectureCode._id, {
      $inc: { usedCount: -1 },
      ...(lectureCode.maxUses !== null ? { isActive: true } : {}),
    });
    throw err;
  }

  return jsonResponse({
    success: true,
    lectureId: lectureCode.lectureId,
  });
}

export async function handleCreateOneTimeLectureLink(
  ctx: ApiContext,
): Promise<Response> {
  await db();
  if (!ctx.user) return errorResponse("Unauthorized", 401);
  if (!STAFF_ROLES.includes(ctx.user.role)) {
    return errorResponse("Forbidden", 403);
  }

  const body = ctx.body as { lectureId?: string };
  const lectureId = body?.lectureId?.trim();
  if (!lectureId) return errorResponse("lectureId is required", 400);

  const lecture = await Lecture.findById(lectureId).select("_id").lean();
  if (!lecture) return errorResponse("Lecture not found", 404);

  // Generate a random token, store only its hash.
  let token = generateOneTimeToken();
  let tokenHash = hashOneTimeToken(token);
  let attempts = 0;
  while (attempts < 5) {
    const exists = await OneTimeLectureLink.findOne({ tokenHash })
      .select("_id")
      .lean();
    if (!exists) break;
    token = generateOneTimeToken();
    tokenHash = hashOneTimeToken(token);
    attempts++;
  }

  await OneTimeLectureLink.create({
    tokenHash,
    lectureId: new mongoose.Types.ObjectId(lectureId),
    createdBy: new mongoose.Types.ObjectId(ctx.user.id),
  });

  return jsonResponse({ token }, 201);
}

export async function handleRedeemOneTimeLectureLink(
  ctx: ApiContext,
): Promise<Response> {
  await db();
  if (!ctx.user) return errorResponse("Unauthorized", 401);

  const body = ctx.body as { token?: string };
  const token = body?.token?.trim();
  if (!token) return errorResponse("token is required", 400);

  const tokenHash = hashOneTimeToken(token);

  // Atomically claim the link (single use).
  const claimed = await OneTimeLectureLink.findOneAndUpdate(
    { tokenHash, usedAt: null },
    {
      usedAt: new Date(),
      usedByUserId: new mongoose.Types.ObjectId(ctx.user.id),
      usedByIp: ctx.ip,
    },
    { new: true },
  ).lean();

  if (!claimed) {
    const exists = await OneTimeLectureLink.findOne({ tokenHash })
      .select("usedAt")
      .lean();
    if (!exists) return errorResponse("Invalid link", 404);
    return errorResponse("Link already used", 410);
  }

  // Grant access using the existing lecture code usage mechanism.
  const lectureCode = await LectureCode.findOne({
    lectureId: claimed.lectureId,
    isActive: true,
  })
    .select("_id lectureId")
    .lean();

  if (lectureCode) {
    const existing = await LectureCodeUsage.findOne({
      userId: new mongoose.Types.ObjectId(ctx.user.id),
      lectureId: claimed.lectureId,
    })
      .select("_id")
      .lean();

    if (!existing) {
      await LectureCodeUsage.create({
        userId: new mongoose.Types.ObjectId(ctx.user.id),
        lectureCodeId: lectureCode._id,
        lectureId: claimed.lectureId,
      });
    }
  }

  return jsonResponse({
    success: true,
    lectureId: claimed.lectureId.toString(),
  });
}

export async function handleSubscriptions(
  ctx: ApiContext,
): Promise<Response> {
  await db();
  if (ctx.method === "GET") {
    const userId = ctx.query.get("userId");
    const filter = userId ? { userId } : {};
    const subs = await Subscription.find(filter).sort({ createdAt: -1 }).lean();
    return jsonResponse({ subscriptions: subs });
  }
  if (ctx.method === "POST") {
    const body = ctx.body as {
      userId: string;
      type: string;
      termId?: string;
      academicYearId: string;
      startDate: string;
      endDate: string;
    };
    const sub = await Subscription.create({
      ...body,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      createdBy: ctx.user?.id,
      isActive: true,
    });
    await cacheDel(`subs:user:${body.userId}`);
    return jsonResponse({ subscription: sub }, 201);
  }
  if (ctx.method === "PATCH") {
    const id = ctx.segments[ctx.segments.length - 1];
    const sub = await Subscription.findByIdAndUpdate(id, ctx.body as object, {
      new: true,
    });
    if (sub) await cacheDel(`subs:user:${sub.userId.toString()}`);
    return jsonResponse({ subscription: sub });
  }
  return errorResponse("Method not allowed", 405);
}

export async function handleProgressHeartbeat(
  ctx: ApiContext,
): Promise<Response> {
  await db();
  if (!ctx.user) return errorResponse("Unauthorized", 401);

  const body = ctx.body as {
    mediaId: string;
    lectureId: string;
    currentTimeSeconds: number;
    durationSeconds: number;
    isPlaying: boolean;
  };

  if (!body.isPlaying) {
    return jsonResponse({ ok: true, skipped: true });
  }

  const allowed = await canAccessLecture(ctx.user.id, body.lectureId);
  if (!allowed) return errorResponse("Access denied", 403);

  await bufferProgressHeartbeat({
    userId: ctx.user.id,
    mediaId: body.mediaId,
    lectureId: body.lectureId,
    currentTimeSeconds: body.currentTimeSeconds,
    durationSeconds: body.durationSeconds,
  });

  return jsonResponse({ ok: true, buffered: true });
}

export async function handleStreamManifest(
  ctx: ApiContext,
): Promise<Response> {
  await db();
  if (!ctx.user) return errorResponse("Unauthorized", 401);

  const mediaId = ctx.segments[ctx.segments.indexOf("stream") + 1];
  const media = await Media.findById(mediaId);
  if (!media) {
    return errorResponse("Media not found", 404);
  }

  if (media.uploadStatus === "FAILED") {
    const { uploadedMediaFileExists } = await import(
      "@/features/media/services/media-upload.service"
    );
    const fileExists = await uploadedMediaFileExists(media);
    if (fileExists && media.fileType === "VIDEO") {
      const key = `hls:auto-reprocess:${media._id.toString()}`;
      const already = await cacheGet(key);
      if (!already) {
        await cacheSet(key, "1", 600);
        await Media.findByIdAndUpdate(media._id, {
          uploadStatus: "PROCESSING",
          $unset: { hlsManifestKey: 1 },
        });
        const { processMediaAfterUpload } = await import(
          "@/features/media/services/transcode.service"
        );
        void processMediaAfterUpload(media._id.toString());
      }
      const fresh = await Media.findById(media._id).select("uploadStatus").lean();
      return errorResponse(
        "Video is processing",
        409,
        undefined,
        {
          reason:
            fresh?.uploadStatus === "FAILED" ? "TRANSCODE_FAILED" : "PROCESSING",
          mediaId: media._id.toString(),
          uploadStatus: fresh?.uploadStatus ?? "PROCESSING",
          hint: "Retry in a few seconds.",
        },
      );
    }
    return errorResponse(
      "Video processing failed",
      409,
      undefined,
      {
        reason: "TRANSCODE_FAILED",
        mediaId: media._id.toString(),
        uploadStatus: media.uploadStatus,
        fileExists,
        hint: fileExists
          ? "POST /api/media/{mediaId}/reprocess as staff to retry transcoding."
          : "Re-upload the video file (source file missing on server).",
      },
    );
  }

  if (media.uploadStatus !== "READY" && media.uploadStatus !== "PROCESSING") {
    return errorResponse("Media not available", 404);
  }

  const allowed = await canAccessLecture(
    ctx.user.id,
    media.lectureId.toString(),
  );
  if (!allowed) return errorResponse("Access denied", 403);

  const { hlsManifestExists } = await import(
    "@/features/streaming/services/stream.service"
  );
  const hasHls = await hlsManifestExists(media);
  if (media.hlsManifestKey && !hasHls) {
    await Media.findByIdAndUpdate(media._id, { $unset: { hlsManifestKey: 1 } });
  }

  // Security: do NOT expose a direct video file URL. Force video playback through HLS.
  // (Audio/PDF can still use the file endpoint when HLS isn't available.)
  if (media.fileType === "VIDEO" && !hasHls) {
    const { ffmpegAvailable } = await import(
      "@/features/media/services/transcode.service"
    );
    const ffmpeg = await ffmpegAvailable();
    const reason =
      media.uploadStatus === "PROCESSING"
        ? "PROCESSING"
        : media.uploadStatus === "FAILED"
          ? "TRANSCODE_FAILED"
          : !ffmpeg
            ? "FFMPEG_NOT_INSTALLED"
            : "HLS_NOT_GENERATED";

    // If FFmpeg is available and HLS isn't generated yet, auto-trigger reprocessing (best-effort).
    if (ffmpeg && reason === "HLS_NOT_GENERATED") {
      const key = `hls:auto-reprocess:${media._id.toString()}`;
      const already = await cacheGet(key);
      if (!already) {
        await cacheSet(key, "1", 300);
        const { processMediaAfterUpload } = await import(
          "@/features/media/services/transcode.service"
        );
        void processMediaAfterUpload(media._id.toString());
      }
    }

    return errorResponse(
      "Video stream is not ready yet",
      409,
      undefined,
      {
        reason: ffmpeg && reason === "HLS_NOT_GENERATED" ? "PROCESSING" : reason,
        mediaId: media._id.toString(),
        uploadStatus: media.uploadStatus,
        ffmpeg,
        hint:
          reason === "FFMPEG_NOT_INSTALLED"
            ? "Install FFmpeg and set FFMPEG_PATH in .env.local, then POST /api/media/{mediaId}/reprocess as staff."
            : reason === "HLS_NOT_GENERATED" || reason === "TRANSCODE_FAILED"
              ? "POST /api/media/{mediaId}/reprocess as staff to generate encrypted HLS."
              : "Wait for transcoding to finish, then retry.",
      },
    );
  }

  if (hasHls && media.fileType === "VIDEO") {
    const { fetchRewrittenHlsPlaylist } = await import(
      "@/features/streaming/services/stream.service"
    );
    const hlsPlaylist = await fetchRewrittenHlsPlaylist(media);
    if (!hlsPlaylist) {
      return errorResponse("HLS manifest not available", 404);
    }
    return jsonResponse({
      playback: "hls",
      mediaId: media._id.toString(),
      hlsPlaylist,
    });
  }

  return jsonResponse({
    manifestUrl: hasHls
      ? `/api/stream/${mediaId}/playlist.m3u8`
      : `/api/stream/${mediaId}/file`,
  });
}

export async function handleAdminStats(): Promise<Response> {
  await db();
  const [students, subscriptions, mediaCount, recentLogs] = await Promise.all([
    User.countDocuments({ role: "STUDENT", isActive: true }),
    Subscription.countDocuments({ isActive: true }),
    Media.countDocuments({ uploadStatus: "READY" }),
    AuditLog.find().sort({ timestamp: -1 }).limit(10).lean(),
  ]);
  return jsonResponse({
    students,
    activeSubscriptions: subscriptions,
    mediaReady: mediaCount,
    recentActivity: recentLogs,
  });
}

export async function handleAdminUsage(): Promise<Response> {
  await db();
  const progress = await Progress.find()
    .sort({ updatedAt: -1 })
    .limit(500)
    .populate("userId", "name email")
    .populate("mediaId", "fileName fileType")
    .populate("lectureId", "title")
    .lean();
  return jsonResponse({ usage: progress });
}

export async function handlePromoteAll(): Promise<Response> {
  await db();
  const result = await promoteAllStudents();
  return jsonResponse(result);
}

export async function handleContentTree(
  ctx: ApiContext,
): Promise<Response> {
  await db();
  if (!ctx.user) return errorResponse("Unauthorized", 401);

  const years = await AcademicYear.find({ isActive: true }).sort({ order: 1 });
  const tree = [];

  for (const year of years) {
    const terms = await Term.find({
      academicYearId: year._id,
      isActive: true,
    }).sort({ order: 1 });

    const termsWithContent = [];
    for (const term of terms) {
      const subjects = await Subject.find({ termId: term._id, isActive: true });
      const subjectsWithSections = [];

      for (const subject of subjects) {
        const sections = await Section.find({
          subjectId: subject._id,
          isActive: true,
        }).sort({ order: 1 });

        const sectionsWithLectures = [];
        for (const section of sections) {
          const lectures = await Lecture.find({
            sectionId: section._id,
            isPublished: true,
          }).lean();

          const lecturesWithAccess = [];
          for (const lecture of lectures) {
            const hasAccess = await canAccessLecture(
              ctx.user!.id,
              lecture._id.toString(),
              ctx.user!.role,
            );
            lecturesWithAccess.push({ ...lecture, hasAccess });
          }
          sectionsWithLectures.push({
            ...section.toObject(),
            lectures: lecturesWithAccess,
          });
        }
        subjectsWithSections.push({
          ...subject.toObject(),
          sections: sectionsWithLectures,
        });
      }
      termsWithContent.push({
        ...term.toObject(),
        subjects: subjectsWithSections,
      });
    }
    tree.push({ ...year.toObject(), terms: termsWithContent });
  }

  return jsonResponse({ tree });
}

export async function handleDeleteMedia(ctx: ApiContext): Promise<Response> {
  await db();
  const id = ctx.segments[ctx.segments.length - 1];
  const media = await Media.findById(id);
  if (!media) return errorResponse("Not found", 404);
  const provider = media.storageProvider ?? "r2";
  try {
    await deleteMediaObject(media.fileKey, provider);
    if (media.hlsManifestKey) {
      const hlsId = media.hlsManifestKey.split("/")[1];
      if (hlsId) await deleteMediaHls(hlsId, provider);
    }
  } catch {
    /* continue */
  }
  await Media.findByIdAndDelete(id);
  return jsonResponse({ deleted: true });
}
