import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IOneTimeLectureLink extends Document {
  tokenHash: string;
  lectureId: mongoose.Types.ObjectId;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  usedAt?: Date | null;
  usedByUserId?: mongoose.Types.ObjectId | null;
  usedByIp?: string | null;
}

const OneTimeLectureLinkSchema = new Schema<IOneTimeLectureLink>(
  {
    tokenHash: { type: String, required: true, unique: true, index: true },
    lectureId: { type: Schema.Types.ObjectId, ref: "Lecture", required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    usedAt: { type: Date, default: null },
    usedByUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    usedByIp: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

OneTimeLectureLinkSchema.index({ lectureId: 1, createdAt: -1 });
OneTimeLectureLinkSchema.index({ usedAt: 1 });

export const OneTimeLectureLink: Model<IOneTimeLectureLink> =
  mongoose.models.OneTimeLectureLink ??
  mongoose.model<IOneTimeLectureLink>(
    "OneTimeLectureLink",
    OneTimeLectureLinkSchema,
  );

