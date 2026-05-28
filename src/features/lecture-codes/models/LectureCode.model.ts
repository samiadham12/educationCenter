import mongoose, { Schema, type Document, type Model } from "mongoose";
import { LECTURE_CODE_DEFAULT_MAX_USES } from "@/shared/constants/lecture-code";

export interface ILectureCode extends Document {
  code: string;
  lectureId: mongoose.Types.ObjectId;
  maxUses: number | null;
  usedCount: number;
  expiresAt: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LectureCodeSchema = new Schema<ILectureCode>(
  {
    code: { type: String, required: true, unique: true, uppercase: true },
    lectureId: { type: Schema.Types.ObjectId, ref: "Lecture", required: true },
    maxUses: { type: Number, default: LECTURE_CODE_DEFAULT_MAX_USES },
    usedCount: { type: Number, default: 0 },
    expiresAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

LectureCodeSchema.index({ lectureId: 1 });
LectureCodeSchema.index({ isActive: 1, expiresAt: 1 });

export const LectureCode: Model<ILectureCode> =
  mongoose.models.LectureCode ??
  mongoose.model<ILectureCode>("LectureCode", LectureCodeSchema);
