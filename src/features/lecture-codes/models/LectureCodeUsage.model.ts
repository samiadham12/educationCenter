import mongoose, { Schema, type Document, type Model } from "mongoose";
import { cacheSet } from "@/shared/lib/redis";

export interface ILectureCodeUsage extends Document {
  userId: mongoose.Types.ObjectId;
  lectureCodeId: mongoose.Types.ObjectId;
  lectureId: mongoose.Types.ObjectId;
  usedAt: Date;
}

const LectureCodeUsageSchema = new Schema<ILectureCodeUsage>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  lectureCodeId: {
    type: Schema.Types.ObjectId,
    ref: "LectureCode",
    required: true,
  },
  lectureId: { type: Schema.Types.ObjectId, ref: "Lecture", required: true },
  usedAt: { type: Date, default: Date.now },
});

LectureCodeUsageSchema.index({ userId: 1, lectureId: 1 }, { unique: true });
LectureCodeUsageSchema.index({ userId: 1, lectureCodeId: 1 });

LectureCodeUsageSchema.post("save", async function afterUsage(doc) {
  await cacheSet(
    `access:lecture:${doc.userId.toString()}:${doc.lectureId.toString()}`,
    "1",
    86400,
  );
});

export const LectureCodeUsage: Model<ILectureCodeUsage> =
  mongoose.models.LectureCodeUsage ??
  mongoose.model<ILectureCodeUsage>("LectureCodeUsage", LectureCodeUsageSchema);
