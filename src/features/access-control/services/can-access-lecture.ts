import mongoose from "mongoose";
import { LectureCodeUsage } from "@/features/lecture-codes/models/LectureCodeUsage.model";
import { Subscription } from "@/features/subscriptions/models/Subscription.model";
import { Lecture } from "@/features/lectures/models/Lecture.model";
import { cacheGet, cacheSet } from "@/shared/lib/redis";
import type { Role } from "@/shared/constants/roles";
import { STAFF_ROLES } from "@/shared/constants/roles";
import { User } from "@/features/users/models/User.model";

export async function canAccessLecture(
  userId: string,
  lectureId: string,
  role?: Role,
): Promise<boolean> {
  if (role && STAFF_ROLES.includes(role)) return true;

  // Stream tokens may only carry userId. If we can cheaply detect staff,
  // allow full access without requiring subscription/code checks.
  const roleCacheKey = `role:user:${userId}`;
  const cachedRole = await cacheGet(roleCacheKey);
  if (cachedRole && STAFF_ROLES.includes(cachedRole as Role)) return true;

  if (!cachedRole) {
    const dbUser = await User.findById(userId).select("role").lean();
    const dbRole = (dbUser?.role as Role | undefined) ?? "STUDENT";
    // Cache briefly to avoid repeated lookups during streaming.
    await cacheSet(roleCacheKey, dbRole, 900);
    if (STAFF_ROLES.includes(dbRole)) return true;
  }

  const cacheKey = `access:lecture:${userId}:${lectureId}`;
  const cached = await cacheGet(cacheKey);
  if (cached === "1") return true;

  const usage = await LectureCodeUsage.findOne({
    userId: new mongoose.Types.ObjectId(userId),
    lectureId: new mongoose.Types.ObjectId(lectureId),
  }).lean();

  if (usage) {
    await cacheSet(cacheKey, "1", 86400);
    return true;
  }

  const lecture = await Lecture.findById(lectureId).lean();
  if (!lecture) return false;

  const subsCache = await cacheGet(`subs:user:${userId}`);
  let subs: Array<{
    type: string;
    termId?: string;
    academicYearId: string;
    isActive: boolean;
    endDate: Date;
  }> = [];

  if (subsCache) {
    subs = JSON.parse(subsCache);
  } else {
    const dbSubs = await Subscription.find({
      userId: new mongoose.Types.ObjectId(userId),
      isActive: true,
      endDate: { $gte: new Date() },
    }).lean();
    subs = dbSubs.map((s) => ({
      type: s.type,
      termId: s.termId?.toString(),
      academicYearId: s.academicYearId.toString(),
      isActive: s.isActive,
      endDate: s.endDate,
    }));
    await cacheSet(`subs:user:${userId}`, JSON.stringify(subs), 900);
  }

  const now = new Date();
  for (const sub of subs) {
    if (!sub.isActive || new Date(sub.endDate) < now) continue;
    if (sub.type === "TERM" && sub.termId === lecture.termId.toString()) {
      return true;
    }
    if (
      sub.type === "FULL_YEAR" &&
      sub.academicYearId === lecture.academicYearId.toString()
    ) {
      return true;
    }
  }

  return false;
}
