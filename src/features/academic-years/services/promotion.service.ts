import mongoose from "mongoose";
import { User } from "@/features/users/models/User.model";
import { AcademicYear } from "@/features/academic-years/models/AcademicYear.model";

export async function checkAndPromoteStudent(userId: string): Promise<boolean> {
  const month = Number(process.env.PROMOTION_MONTH ?? 9);
  const day = Number(process.env.PROMOTION_DAY ?? 1);
  const now = new Date();
  const promotionDate = new Date(now.getFullYear(), month - 1, day);

  if (now < promotionDate) return false;

  const user = await User.findById(userId);
  if (!user || user.role !== "STUDENT") return false;

  if (user.lastPromotedAt && user.lastPromotedAt >= promotionDate) {
    return false;
  }

  const currentOrder = user.currentYearOrder ?? 1;
  if (currentOrder >= 4) return false;

  const nextYear = await AcademicYear.findOne({ order: currentOrder + 1 });
  if (!nextYear) return false;

  user.currentYearOrder = currentOrder + 1;
  user.currentAcademicYearId = nextYear._id;
  user.lastPromotedAt = now;
  await user.save();
  return true;
}

export async function promoteAllStudents(): Promise<{
  promoted: number;
  skipped: number;
}> {
  const month = Number(process.env.PROMOTION_MONTH ?? 9);
  const day = Number(process.env.PROMOTION_DAY ?? 1);
  const now = new Date();
  const promotionDate = new Date(now.getFullYear(), month - 1, day);

  const students = await User.find({
    role: "STUDENT",
    isActive: true,
    $or: [
      { lastPromotedAt: null },
      { lastPromotedAt: { $lt: promotionDate } },
    ],
    currentYearOrder: { $lt: 4 },
  });

  let promoted = 0;
  let skipped = 0;

  for (const student of students) {
    const nextYear = await AcademicYear.findOne({
      order: (student.currentYearOrder ?? 1) + 1,
    });
    if (!nextYear) {
      skipped++;
      continue;
    }
    student.currentYearOrder = (student.currentYearOrder ?? 1) + 1;
    student.currentAcademicYearId = nextYear._id;
    student.lastPromotedAt = now;
    await student.save();
    promoted++;
  }

  return { promoted, skipped };
}
