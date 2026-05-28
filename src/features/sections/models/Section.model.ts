import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface ISection extends Document {
  name: string;
  subjectId: mongoose.Types.ObjectId;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SectionSchema = new Schema<ISection>(
  {
    name: { type: String, required: true },
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    order: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

SectionSchema.index({ subjectId: 1, name: 1 }, { unique: true });
SectionSchema.index({ subjectId: 1, order: 1 });

export const Section: Model<ISection> =
  mongoose.models.Section ?? mongoose.model<ISection>("Section", SectionSchema);
