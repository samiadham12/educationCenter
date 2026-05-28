import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface ITerm extends Document {
  name: string;
  academicYearId: mongoose.Types.ObjectId;
  order: 1 | 2;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TermSchema = new Schema<ITerm>(
  {
    name: { type: String, required: true },
    academicYearId: {
      type: Schema.Types.ObjectId,
      ref: "AcademicYear",
      required: true,
    },
    order: { type: Number, enum: [1, 2], required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

TermSchema.index({ academicYearId: 1, order: 1 });
TermSchema.index({ isActive: 1 });

export const Term: Model<ITerm> =
  mongoose.models.Term ?? mongoose.model<ITerm>("Term", TermSchema);
