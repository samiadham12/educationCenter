import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IAuditLog extends Document {
  userId?: mongoose.Types.ObjectId;
  action: string;
  endpoint: string;
  method: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>({
  userId: { type: Schema.Types.ObjectId, ref: "User" },
  action: { type: String, required: true },
  endpoint: { type: String, required: true },
  method: { type: String, required: true },
  ip: { type: String },
  userAgent: { type: String },
  metadata: { type: Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now },
});

AuditLogSchema.index({ timestamp: -1 });
AuditLogSchema.index({ userId: 1, timestamp: -1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index(
  { timestamp: 1 },
  { expireAfterSeconds: 7776000 },
);

export const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog ??
  mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);
