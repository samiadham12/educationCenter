import type { ApiContext, ApiHandler } from "@/shared/types/api";
import { errorResponse } from "@/shared/utils/response";
import {
  handleHealth,
  handleLogin,
  handleSession,
  handleSignup,
  handleSignupYears,
  handleCreateStaff,
  handleCreateStudent,
  handleListUsers,
  handlePatchUser,
  handleAcademicYears,
  handleTerms,
  handleSubjects,
  handleSections,
  handleLectures,
  handleMediaPresign,
  handleMediaLocalUpload,
  handleMediaConfirm,
  handleRedeemCode,
  handleCreateOneTimeLectureLink,
  handleRedeemOneTimeLectureLink,
  handleSubscriptions,
  handleProgressHeartbeat,
  handleStreamManifest,
  handleAdminStats,
  handleAdminUsage,
  handlePromoteAll,
  handleContentTree,
  handleDeleteMedia,
} from "./route-handlers";
import { handlePatchUserLocale } from "./locale-handlers";
import {
  handleGetTranslations,
  handlePutTranslations,
} from "@/features/translations/handlers/translation.handlers";
import {
  handleLogout,
  handleListMedia,
  handleMediaLectureOptions,
  handleGetProgress,
  handleLectureCodesByLecture,
  handleRegenerateLectureCode,
  handleReprocessMedia,
  handleStreamPlaylist,
  handleStreamChunk,
  handleStreamKey,
  handleStreamSegment,
  handleStreamHlsDirect,
  handleStreamFile,
  handleStreamPdf,
  handleAdminUsageExport,
  handleFlushProgress,
  handleBulkStudents,
  handleDeleteUser,
} from "./route-handlers-extra";

type RouteMatch = {
  method: string;
  pattern: RegExp;
  handler: ApiHandler;
};

const routes: RouteMatch[] = [
  { method: "GET", pattern: /^\/api\/health$/, handler: () => handleHealth() },
  {
    method: "POST",
    pattern: /^\/api\/auth\/login$/,
    handler: (ctx) => handleLogin(ctx),
  },
  {
    method: "GET",
    pattern: /^\/api\/auth\/signup-years$/,
    handler: () => handleSignupYears(),
  },
  {
    method: "POST",
    pattern: /^\/api\/auth\/signup$/,
    handler: (ctx) => handleSignup(ctx),
  },
  {
    method: "GET",
    pattern: /^\/api\/auth\/session$/,
    handler: () => handleSession(),
  },
  {
    method: "POST",
    pattern: /^\/api\/auth\/logout$/,
    handler: () => handleLogout(),
  },
  {
    method: "POST",
    pattern: /^\/api\/users\/staff$/,
    handler: (ctx) => handleCreateStaff(ctx),
  },
  {
    method: "POST",
    pattern: /^\/api\/users\/students$/,
    handler: (ctx) => handleCreateStudent(ctx),
  },
  {
    method: "POST",
    pattern: /^\/api\/users\/students\/bulk$/,
    handler: (ctx) => handleBulkStudents(ctx),
  },
  {
    method: "GET",
    pattern: /^\/api\/users$/,
    handler: (ctx) => handleListUsers(ctx),
  },
  {
    method: "PATCH",
    pattern: /^\/api\/users\/me\/locale$/,
    handler: (ctx) => handlePatchUserLocale(ctx),
  },
  {
    method: "GET",
    pattern: /^\/api\/translations\/[^/]+\/[^/]+$/,
    handler: (ctx) => handleGetTranslations(ctx),
  },
  {
    method: "PUT",
    pattern: /^\/api\/translations\/[^/]+\/[^/]+$/,
    handler: (ctx) => handlePutTranslations(ctx),
  },
  {
    method: "PATCH",
    pattern: /^\/api\/users\/[^/]+$/,
    handler: (ctx) => handlePatchUser(ctx),
  },
  {
    method: "DELETE",
    pattern: /^\/api\/users\/[^/]+$/,
    handler: (ctx) => handleDeleteUser(ctx),
  },
  {
    method: "GET",
    pattern: /^\/api\/academic-years$/,
    handler: (ctx) => handleAcademicYears(ctx),
  },
  {
    method: "POST",
    pattern: /^\/api\/academic-years$/,
    handler: (ctx) => handleAcademicYears(ctx),
  },
  {
    method: "PUT",
    pattern: /^\/api\/academic-years\/[^/]+$/,
    handler: (ctx) => handleAcademicYears(ctx),
  },
  {
    method: "DELETE",
    pattern: /^\/api\/academic-years\/[^/]+$/,
    handler: (ctx) => handleAcademicYears(ctx),
  },
  {
    method: "POST",
    pattern: /^\/api\/academic-years\/promote-all$/,
    handler: () => handlePromoteAll(),
  },
  { method: "GET", pattern: /^\/api\/terms$/, handler: (ctx) => handleTerms(ctx) },
  { method: "POST", pattern: /^\/api\/terms$/, handler: (ctx) => handleTerms(ctx) },
  { method: "PUT", pattern: /^\/api\/terms\/[^/]+$/, handler: (ctx) => handleTerms(ctx) },
  {
    method: "DELETE",
    pattern: /^\/api\/terms\/[^/]+$/,
    handler: (ctx) => handleTerms(ctx),
  },
  {
    method: "GET",
    pattern: /^\/api\/subjects$/,
    handler: (ctx) => handleSubjects(ctx),
  },
  {
    method: "POST",
    pattern: /^\/api\/subjects$/,
    handler: (ctx) => handleSubjects(ctx),
  },
  {
    method: "PUT",
    pattern: /^\/api\/subjects\/[^/]+$/,
    handler: (ctx) => handleSubjects(ctx),
  },
  {
    method: "DELETE",
    pattern: /^\/api\/subjects\/[^/]+$/,
    handler: (ctx) => handleSubjects(ctx),
  },
  {
    method: "GET",
    pattern: /^\/api\/sections$/,
    handler: (ctx) => handleSections(ctx),
  },
  {
    method: "GET",
    pattern: /^\/api\/lectures$/,
    handler: (ctx) => handleLectures(ctx),
  },
  {
    method: "POST",
    pattern: /^\/api\/lectures$/,
    handler: (ctx) => handleLectures(ctx),
  },
  {
    method: "PUT",
    pattern: /^\/api\/lectures\/[^/]+$/,
    handler: (ctx) => handleLectures(ctx),
  },
  {
    method: "DELETE",
    pattern: /^\/api\/lectures\/[^/]+$/,
    handler: (ctx) => handleLectures(ctx),
  },
  {
    method: "POST",
    pattern: /^\/api\/media\/presign$/,
    handler: (ctx) => handleMediaPresign(ctx),
  },
  {
    method: "POST",
    pattern: /^\/api\/media\/upload$/,
    handler: (ctx) => handleMediaLocalUpload(ctx),
  },
  {
    method: "POST",
    pattern: /^\/api\/media\/confirm$/,
    handler: (ctx) => handleMediaConfirm(ctx),
  },
  {
    method: "GET",
    pattern: /^\/api\/media$/,
    handler: (ctx) => handleListMedia(ctx),
  },
  {
    method: "GET",
    pattern: /^\/api\/media\/lecture-options$/,
    handler: () => handleMediaLectureOptions(),
  },
  {
    method: "DELETE",
    pattern: /^\/api\/media\/[^/]+$/,
    handler: (ctx) => handleDeleteMedia(ctx),
  },
  {
    method: "POST",
    pattern: /^\/api\/media\/[^/]+\/reprocess$/,
    handler: (ctx) => handleReprocessMedia(ctx),
  },
  {
    method: "POST",
    pattern: /^\/api\/lecture-codes\/redeem$/,
    handler: (ctx) => handleRedeemCode(ctx),
  },
  {
    method: "POST",
    pattern: /^\/api\/one-time-lecture-links$/,
    handler: (ctx) => handleCreateOneTimeLectureLink(ctx),
  },
  {
    method: "POST",
    pattern: /^\/api\/one-time-lecture-links\/redeem$/,
    handler: (ctx) => handleRedeemOneTimeLectureLink(ctx),
  },
  {
    method: "GET",
    pattern: /^\/api\/lecture-codes\/[^/]+$/,
    handler: (ctx) => handleLectureCodesByLecture(ctx),
  },
  {
    method: "POST",
    pattern: /^\/api\/lecture-codes\/regenerate$/,
    handler: (ctx) => handleRegenerateLectureCode(ctx),
  },
  {
    method: "GET",
    pattern: /^\/api\/subscriptions$/,
    handler: (ctx) => handleSubscriptions(ctx),
  },
  {
    method: "POST",
    pattern: /^\/api\/subscriptions$/,
    handler: (ctx) => handleSubscriptions(ctx),
  },
  {
    method: "PATCH",
    pattern: /^\/api\/subscriptions\/[^/]+$/,
    handler: (ctx) => handleSubscriptions(ctx),
  },
  {
    method: "POST",
    pattern: /^\/api\/progress\/heartbeat$/,
    handler: (ctx) => handleProgressHeartbeat(ctx),
  },
  {
    method: "POST",
    pattern: /^\/api\/progress\/flush$/,
    handler: () => handleFlushProgress(),
  },
  {
    method: "GET",
    pattern: /^\/api\/progress\/[^/]+$/,
    handler: (ctx) => handleGetProgress(ctx),
  },
  {
    method: "GET",
    pattern: /^\/api\/stream\/[^/]+\/manifest$/,
    handler: (ctx) => handleStreamManifest(ctx),
  },
  {
    method: "GET",
    pattern: /^\/api\/stream\/[^/]+\/playlist\.m3u8$/,
    handler: (ctx) => handleStreamPlaylist(ctx),
  },
  {
    method: "GET",
    pattern: /^\/api\/stream\/[^/]+\/chunk$/,
    handler: (ctx) => handleStreamChunk(ctx),
  },
  {
    method: "GET",
    pattern: /^\/api\/stream\/[^/]+\/key$/,
    handler: (ctx) => handleStreamKey(ctx),
  },
  {
    method: "GET",
    pattern: /^\/api\/stream\/[^/]+\/segment\/[^/]+$/,
    handler: (ctx) => handleStreamSegment(ctx),
  },
  {
    method: "GET",
    pattern: /^\/api\/stream\/[^/]+\/[^/]+\.ts$/,
    handler: (ctx) => handleStreamHlsDirect(ctx),
  },
  {
    method: "GET",
    pattern: /^\/api\/stream\/[^/]+\/file$/,
    handler: (ctx) => handleStreamFile(ctx),
  },
  {
    method: "GET",
    pattern: /^\/api\/stream\/pdf\/[^/]+$/,
    handler: (ctx) => handleStreamPdf(ctx),
  },
  {
    method: "GET",
    pattern: /^\/api\/admin\/stats$/,
    handler: () => handleAdminStats(),
  },
  {
    method: "GET",
    pattern: /^\/api\/admin\/usage$/,
    handler: () => handleAdminUsage(),
  },
  {
    method: "GET",
    pattern: /^\/api\/admin\/usage\/export$/,
    handler: () => handleAdminUsageExport(),
  },
  {
    method: "GET",
    pattern: /^\/api\/student\/content-tree$/,
    handler: (ctx) => handleContentTree(ctx),
  },
];

export const mainRouter: ApiHandler = async (ctx) => {
  for (const route of routes) {
    if (route.method === ctx.method && route.pattern.test(ctx.path)) {
      return route.handler(ctx);
    }
  }
  return errorResponse("Not found", 404);
};
