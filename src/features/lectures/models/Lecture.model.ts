import mongoose, { Schema, type Document, type Model } from "mongoose";
import { LectureCode } from "@/features/lecture-codes/models/LectureCode.model";
import { lectureCodeDefaults } from "@/shared/constants/lecture-code";
import { generateLectureCode } from "@/shared/utils/crypto";

export interface ILecture extends Document {
  title: string;
  description?: string;
  sectionId: mongoose.Types.ObjectId;
  subjectId: mongoose.Types.ObjectId;
  termId: mongoose.Types.ObjectId;
  academicYearId: mongoose.Types.ObjectId;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LectureSchema = new Schema<ILecture>(
  {
    title: { type: String, required: true, maxlength: 200 },
    description: { type: String, maxlength: 1000 },
    sectionId: { type: Schema.Types.ObjectId, ref: "Section", required: true },
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    termId: { type: Schema.Types.ObjectId, ref: "Term", required: true },
    academicYearId: {
      type: Schema.Types.ObjectId,
      ref: "AcademicYear",
      required: true,
    },
    isPublished: { type: Boolean, default: false },
  },
  { timestamps: true },
);

LectureSchema.index({ sectionId: 1, isPublished: 1 });
LectureSchema.index({ academicYearId: 1, termId: 1, subjectId: 1 });

LectureSchema.post("save", async function createLectureCode(doc: ILecture) {
  const existingCode = await LectureCode.findOne({ lectureId: doc._id });
  if (existingCode) return;
  let code = generateLectureCode();
  let attempts = 0;
  while (attempts < 5) {
    const exists = await LectureCode.findOne({ code });
    if (!exists) break;
    code = generateLectureCode();
    attempts++;
  }
  await LectureCode.create({
    code,
    lectureId: doc._id,
    ...lectureCodeDefaults(),
  });
});

export const Lecture: Model<ILecture> =
  mongoose.models.Lecture ?? mongoose.model<ILecture>("Lecture", LectureSchema);
