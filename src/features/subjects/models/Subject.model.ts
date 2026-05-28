import mongoose, { Schema, type Document, type Model } from "mongoose";
import { Section } from "@/features/sections/models/Section.model";

export interface ISubject extends Document {
  name: string;
  termId: mongoose.Types.ObjectId;
  sectionCount: 2 | 3;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SECTION_NAMES = ["Section A", "Section B", "Section C"];

const SubjectSchema = new Schema<ISubject>(
  {
    name: { type: String, required: true, maxlength: 150 },
    termId: { type: Schema.Types.ObjectId, ref: "Term", required: true },
    sectionCount: { type: Number, enum: [2, 3], required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

SubjectSchema.index({ termId: 1, name: 1 }, { unique: true });
SubjectSchema.index({ isActive: 1 });

SubjectSchema.post("save", async function createSections(doc: ISubject) {
  const existing = await Section.countDocuments({ subjectId: doc._id });
  if (existing > 0) return;
  const count = doc.sectionCount;
  const sections = SECTION_NAMES.slice(0, count).map((name, index) => ({
    name,
    subjectId: doc._id,
    order: index + 1,
    isActive: true,
  }));
  await Section.insertMany(sections);
});

export const Subject: Model<ISubject> =
  mongoose.models.Subject ?? mongoose.model<ISubject>("Subject", SubjectSchema);
