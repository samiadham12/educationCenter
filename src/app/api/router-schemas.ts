import { z } from "zod";
import type { Permission } from "@/shared/constants/permissions";
import { isPublicApiRoute } from "@/shared/constants/public-routes";

type RouteSchema = {
  body?: z.ZodType;
  query?: z.ZodType;
};

const schemas: Record<string, RouteSchema> = {
  "POST /api/auth/signup": {
    body: z.object({
      email: z.string().email(),
      password: z.string().min(8),
      name: z.string().min(1).max(100),
      currentAcademicYearId: z.string().optional(),
    }),
  },
  "POST /api/users/staff": {
    body: z.object({
      email: z.string().email(),
      password: z.string().min(8),
      name: z.string().min(1),
      role: z.enum(["ADMIN", "MODERATOR"]),
    }),
  },
  "POST /api/academic-years": {
    body: z.object({
      name: z.string().min(1).max(200),
      order: z.number().int().min(1).max(4),
    }),
  },
  "POST /api/users/students": {
    body: z.object({
      email: z.string().email(),
      password: z.string().min(8),
      name: z.string().min(1),
      currentAcademicYearId: z.string(),
      currentYearOrder: z.number().min(1).max(4),
    }),
  },
  "POST /api/lecture-codes/redeem": {
    body: z.object({ code: z.string().min(4) }),
  },
  "POST /api/lecture-codes/regenerate": {
    body: z.object({ lectureId: z.string() }),
  },
  "POST /api/one-time-lecture-links": {
    body: z.object({ lectureId: z.string().min(1) }),
  },
  "POST /api/one-time-lecture-links/redeem": {
    body: z.object({ token: z.string().min(10) }),
  },
  "POST /api/users/students/bulk": {
    body: z.object({
      students: z.array(
        z.object({
          email: z.string().email(),
          password: z.string().min(8),
          name: z.string(),
          currentAcademicYearId: z.string(),
          currentYearOrder: z.number().min(1).max(4),
        }),
      ),
    }),
  },
  "POST /api/progress/heartbeat": {
    body: z.object({
      mediaId: z.string(),
      lectureId: z.string(),
      currentTimeSeconds: z.number().min(0),
      durationSeconds: z.number().min(1),
      isPlaying: z.boolean(),
    }),
  },
  "POST /api/media/presign": {
    body: z.object({
      lectureId: z.string(),
      fileName: z.string(),
      fileType: z.enum(["VIDEO", "AUDIO", "PDF"]),
      mimeType: z.string(),
      fileSize: z.number().positive(),
    }),
  },
  "POST /api/media/confirm": {
    body: z.object({
      mediaId: z.string(),
      durationSeconds: z.number().optional(),
    }),
  },
  "POST /api/subscriptions": {
    body: z.object({
      userId: z.string(),
      type: z.enum(["TERM", "FULL_YEAR"]),
      termId: z.string().optional(),
      academicYearId: z.string(),
      startDate: z.string(),
      endDate: z.string(),
    }),
  },
};

const permissions: Record<string, Permission> = {
  "GET /api/users": "users:read",
  "POST /api/users/staff": "users:write",
  "POST /api/users/students": "users:write",
  "PATCH /api/users": "users:write",
  "GET /api/academic-years": "content:read",
  "POST /api/academic-years": "content:write",
  "PUT /api/academic-years": "content:write",
  "DELETE /api/academic-years": "content:delete",
  "GET /api/terms": "content:read",
  "POST /api/terms": "content:write",
  "GET /api/subjects": "content:read",
  "POST /api/subjects": "content:write",
  "GET /api/sections": "content:read",
  "GET /api/lectures": "content:read",
  "POST /api/lectures": "content:write",
  "POST /api/media/presign": "media:upload",
  "POST /api/media/upload": "media:upload",
  "POST /api/media/confirm": "media:upload",
  "GET /api/subscriptions": "subscriptions:read",
  "POST /api/subscriptions": "subscriptions:write",
  "PATCH /api/subscriptions": "subscriptions:write",
  "GET /api/admin/stats": "usage:read",
  "GET /api/admin/usage": "usage:read",
  "GET /api/admin/usage/export": "usage:read",
  "POST /api/academic-years/promote-all": "promotion:execute",
  "POST /api/lecture-codes/regenerate": "content:write",
  "POST /api/users/students/bulk": "users:write",
  "POST /api/progress/flush": "usage:read",
  "GET /api/media": "media:stream",
  "GET /api/media/lecture-options": "content:read",
  "GET /api/lecture-codes": "content:read",
  "GET /api/stream": "media:stream",
  "POST /api/lecture-codes/redeem": "media:stream",
  "POST /api/progress/heartbeat": "media:stream",
  "GET /api/student/content-tree": "media:stream",
  "POST /api/one-time-lecture-links": "content:write",
  "POST /api/one-time-lecture-links/redeem": "media:stream",
};

export function getRouteSchema(
  method: string,
  path: string,
): RouteSchema | undefined {
  return schemas[`${method} ${path}`];
}

export function getRoutePermission(
  method: string,
  path: string,
): Permission | undefined {
  if (isPublicApiRoute(method, path)) return undefined;

  const exact = permissions[`${method} ${path}`];
  if (exact) return exact;

  if (path.startsWith("/api/admin")) return "usage:read";
  if (path.startsWith("/api/stream")) return "media:stream";
  if (method === "GET" && path.startsWith("/api/lecture-codes/")) {
    return "content:read";
  }
  if (method === "GET" && path.startsWith("/api/progress/")) {
    return "media:stream";
  }
  if (method === "PATCH" && path === "/api/users/me/locale") return undefined;
  if (path.startsWith("/api/translations/")) return "content:write";
  if (method === "PATCH" && path.startsWith("/api/users/")) return "users:write";
  if (method === "DELETE" && path.startsWith("/api/users/")) {
    return "users:delete";
  }
  if (method === "PATCH" && path.startsWith("/api/subscriptions/")) {
    return "subscriptions:write";
  }
  if (method === "DELETE" && path.startsWith("/api/")) return "content:delete";
  if (method === "PUT" && path.startsWith("/api/")) return "content:write";
  if (method === "POST" && path.startsWith("/api/")) return "content:write";

  return undefined;
}
