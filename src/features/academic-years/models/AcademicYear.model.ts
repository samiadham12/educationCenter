import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IAcademicYear extends Document {
  name: string;
  order: 1 | 2 | 3 | 4;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AcademicYearSchema = new Schema<IAcademicYear>(
  {
    name: { type: String, required: true },
    order: { type: Number, enum: [1, 2, 3, 4], required: true, unique: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

AcademicYearSchema.index({ isActive: 1 });

export const AcademicYear: Model<IAcademicYear> =
  mongoose.models.AcademicYear ??
  mongoose.model<IAcademicYear>("AcademicYear", AcademicYearSchema);
