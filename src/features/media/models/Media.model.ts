import mongoose, { Schema, type Document, type Model } from "mongoose";

export type MediaFileType = "VIDEO" | "AUDIO" | "PDF";
export type UploadStatus = "PENDING" | "PROCESSING" | "READY" | "FAILED";

export type MediaStorageProvider = "r2" | "local";

export interface IMedia extends Document {
  fileName: string;
  fileKey: string;
  fileType: MediaFileType;
  mimeType: string;
  durationSeconds?: number;
  lectureId: mongoose.Types.ObjectId;
  hlsManifestKey?: string;
  hlsEncrypted?: boolean;
  storageProvider: MediaStorageProvider;
  uploadStatus: UploadStatus;
  createdAt: Date;
  updatedAt: Date;
}

const MediaSchema = new Schema<IMedia>(
  {
    fileName: { type: String, required: true },
    fileKey: { type: String, required: true, unique: true },
    fileType: {
      type: String,
      enum: ["VIDEO", "AUDIO", "PDF"],
      required: true,
    },
    mimeType: { type: String, required: true },
    durationSeconds: { type: Number },
    lectureId: { type: Schema.Types.ObjectId, ref: "Lecture", required: true },
    hlsManifestKey: { type: String },
    hlsEncrypted: { type: Boolean, default: false },
    storageProvider: {
      type: String,
      enum: ["r2", "local"],
      default: "r2",
    },
    uploadStatus: {
      type: String,
      enum: ["PENDING", "PROCESSING", "READY", "FAILED"],
      default: "PENDING",
    },
  },
  { timestamps: true },
);

MediaSchema.index({ lectureId: 1, fileType: 1 });
MediaSchema.index({ uploadStatus: 1 });
MediaSchema.index({ fileType: 1 });

export const Media: Model<IMedia> =
  mongoose.models.Media ?? mongoose.model<IMedia>("Media", MediaSchema);
