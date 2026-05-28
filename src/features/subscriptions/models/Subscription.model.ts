import mongoose, { Schema, type Document, type Model } from "mongoose";

export type SubscriptionType = "TERM" | "FULL_YEAR";

export interface ISubscription extends Document {
  userId: mongoose.Types.ObjectId;
  type: SubscriptionType;
  termId?: mongoose.Types.ObjectId;
  academicYearId: mongoose.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["TERM", "FULL_YEAR"], required: true },
    termId: { type: Schema.Types.ObjectId, ref: "Term" },
    academicYearId: {
      type: Schema.Types.ObjectId,
      ref: "AcademicYear",
      required: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

SubscriptionSchema.index({ userId: 1, isActive: 1 });
SubscriptionSchema.index({ type: 1 });
SubscriptionSchema.index({ termId: 1 });
SubscriptionSchema.index({ userId: 1, type: 1, termId: 1, isActive: 1 });
SubscriptionSchema.index({
  userId: 1,
  academicYearId: 1,
  type: 1,
  isActive: 1,
});
SubscriptionSchema.index({ endDate: 1 });

export const Subscription: Model<ISubscription> =
  mongoose.models.Subscription ??
  mongoose.model<ISubscription>("Subscription", SubscriptionSchema);
