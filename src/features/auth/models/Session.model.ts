import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface ISession extends Document {
  sessionToken: string;
  userId: mongoose.Types.ObjectId;
  expires: Date;
}

const SessionSchema = new Schema<ISession>({
  sessionToken: { type: String, required: true, unique: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  expires: { type: Date, required: true },
});

SessionSchema.index({ userId: 1 });

export const Session: Model<ISession> =
  mongoose.models.Session ?? mongoose.model<ISession>("Session", SessionSchema);
