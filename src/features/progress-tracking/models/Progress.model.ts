import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IProgress extends Document {
  userId: mongoose.Types.ObjectId;
  mediaId: mongoose.Types.ObjectId;
  lectureId: mongoose.Types.ObjectId;
  watchedSeconds: number;
  lastPosition: number;
  totalDuration: number;
  completionPercent: number;
  isCompleted: boolean;
  updatedAt: Date;
}

const ProgressSchema = new Schema<IProgress>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  mediaId: { type: Schema.Types.ObjectId, ref: "Media", required: true },
  lectureId: { type: Schema.Types.ObjectId, ref: "Lecture", required: true },
  watchedSeconds: { type: Number, default: 0 },
  lastPosition: { type: Number, default: 0 },
  totalDuration: { type: Number, required: true },
  completionPercent: { type: Number, default: 0 },
  isCompleted: { type: Boolean, default: false },
  updatedAt: { type: Date, default: Date.now },
});

ProgressSchema.index({ userId: 1, mediaId: 1 }, { unique: true });
ProgressSchema.index({ userId: 1, lectureId: 1 });
ProgressSchema.index({ lectureId: 1, updatedAt: -1 });
ProgressSchema.index({ userId: 1, updatedAt: -1 });
ProgressSchema.index({ isCompleted: 1 });

export const Progress: Model<IProgress> =
  mongoose.models.Progress ??
  mongoose.model<IProgress>("Progress", ProgressSchema);
