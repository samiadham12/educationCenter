import bcrypt from "bcryptjs";
import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { Role } from "@/shared/constants/roles";
import { getDefaultLocale } from "@/shared/i18n/locales";

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  name: string;
  role: Role;
  isActive: boolean;
  preferredLocale: string;
  currentYearOrder?: number;
  currentAcademicYearId?: mongoose.Types.ObjectId;
  lastPromotedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 255,
    },
    passwordHash: { type: String, required: true, select: false },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    role: {
      type: String,
      enum: ["SUPER_ADMIN", "ADMIN", "MODERATOR", "STUDENT"],
      required: true,
    },
    isActive: { type: Boolean, default: true },
    preferredLocale: {
      type: String,
      default: getDefaultLocale,
      trim: true,
      maxlength: 20,
    },
    currentYearOrder: { type: Number, min: 1, max: 4 },
    currentAcademicYearId: { type: Schema.Types.ObjectId, ref: "AcademicYear" },
    lastPromotedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index(
  { lastPromotedAt: 1, currentYearOrder: 1, role: 1 },
  { partialFilterExpression: { role: "STUDENT" } },
);

UserSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("passwordHash")) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

export const User: Model<IUser> =
  mongoose.models.User ?? mongoose.model<IUser>("User", UserSchema);
