import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IVerificationToken extends Document {
  identifier: string;
  token: string;
  expires: Date;
}

const VerificationTokenSchema = new Schema<IVerificationToken>({
  identifier: { type: String, required: true },
  token: { type: String, required: true, unique: true },
  expires: { type: Date, required: true },
});

VerificationTokenSchema.index({ identifier: 1, token: 1 });

export const VerificationToken: Model<IVerificationToken> =
  mongoose.models.VerificationToken ??
  mongoose.model<IVerificationToken>(
    "VerificationToken",
    VerificationTokenSchema,
  );
