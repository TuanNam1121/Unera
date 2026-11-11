import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IAuditLogDocument extends Document {
  adminId: Types.ObjectId;
  adminEmail: string;
  adminName: string;
  action:
    | "CREATE"
    | "UPDATE"
    | "DELETE"
    | "STATUS_CHANGE"
    | "LOCK_ACCOUNT"
    | "UNLOCK_ACCOUNT"
    | "RESOLVE_CONFLICT";
  targetCollection: string;
  targetId: Types.ObjectId;
  targetTitle?: string;
  targetVersion?: number;
  changesBefore?: Record<string, any>;
  changesAfter?: Record<string, any>;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLogDocument>(
  {
    adminId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    adminEmail: { type: String, required: true },
    adminName: { type: String, required: true },
    action: {
      type: String,
      enum: [
        "CREATE",
        "UPDATE",
        "DELETE",
        "STATUS_CHANGE",
        "LOCK_ACCOUNT",
        "UNLOCK_ACCOUNT",
        "RESOLVE_CONFLICT",
      ],
      required: true,
      index: true,
    },
    targetCollection: { type: String, required: true, index: true },
    targetId: { type: Schema.Types.ObjectId, required: true, index: true },
    targetTitle: { type: String, trim: true },
    targetVersion: { type: Number },
    changesBefore: { type: Schema.Types.Mixed },
    changesAfter: { type: Schema.Types.Mixed },
    reason: { type: String, trim: true },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Append-only audit log
  }
);

export const AuditLog: Model<IAuditLogDocument> =
  mongoose.models.AuditLog ||
  mongoose.model<IAuditLogDocument>("AuditLog", AuditLogSchema);

export default AuditLog;

