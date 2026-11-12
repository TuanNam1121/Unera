import mongoose, { Schema, model, models } from "mongoose";

export const USER_ACTIVITY_CATEGORIES = [
  "AUTH",
  "PROFILE",
  "ASSESSMENT",
  "AI",
  "CV",
  "ACTIVITY",
  "MENTOR",
  "SYSTEM",
] as const;

export type UserActivityCategory = (typeof USER_ACTIVITY_CATEGORIES)[number];

export const USER_ACTIVITY_STATUSES = ["SUCCESS", "FAILED", "BLOCKED"] as const;
export type UserActivityStatus = (typeof USER_ACTIVITY_STATUSES)[number];

export const USER_ACTIVITY_SEVERITIES = ["INFO", "WARN", "HIGH"] as const;
export type UserActivitySeverity = (typeof USER_ACTIVITY_SEVERITIES)[number];

export const USER_ACTIVITY_ACTOR_ROLES = [
  "GUEST",
  "STUDENT",
  "MENTOR",
  "ADMIN",
] as const;
export type UserActivityActorRole = (typeof USER_ACTIVITY_ACTOR_ROLES)[number];

export interface IUserActivityGeo {
  country?: string;
  city?: string;
}

export interface IUserActivityLog {
  _id: mongoose.Types.ObjectId;
  actorId?: mongoose.Types.ObjectId | null;
  actorEmail?: string;
  actorName?: string;
  actorRole: UserActivityActorRole;
  category: UserActivityCategory;
  action: string;
  description: string;
  status: UserActivityStatus;
  severity: UserActivitySeverity;
  statusCode?: number;
  errorMessage?: string;
  ipAddress: string;
  geo?: IUserActivityGeo;
  userAgent?: string;
  deviceSummary?: string;
  requestPath: string;
  httpMethod: string;
  targetCollection?: string;
  targetId?: string;
  targetTitle?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const TTL_180_DAYS_SECONDS = 60 * 60 * 24 * 180;

const UserActivityLogSchema = new Schema<IUserActivityLog>(
  {
    actorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    actorEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    actorName: {
      type: String,
      trim: true,
    },
    actorRole: {
      type: String,
      enum: USER_ACTIVITY_ACTOR_ROLES,
      default: "GUEST",
      required: true,
    },
    category: {
      type: String,
      enum: USER_ACTIVITY_CATEGORIES,
      required: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: USER_ACTIVITY_STATUSES,
      default: "SUCCESS",
      required: true,
    },
    severity: {
      type: String,
      enum: USER_ACTIVITY_SEVERITIES,
      default: "INFO",
      required: true,
    },
    statusCode: {
      type: Number,
    },
    errorMessage: {
      type: String,
      trim: true,
    },
    ipAddress: {
      type: String,
      required: true,
      trim: true,
      default: "unknown",
    },
    geo: {
      country: { type: String, trim: true },
      city: { type: String, trim: true },
    },
    userAgent: {
      type: String,
      trim: true,
    },
    deviceSummary: {
      type: String,
      trim: true,
    },
    requestPath: {
      type: String,
      required: true,
      trim: true,
    },
    httpMethod: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    targetCollection: {
      type: String,
      trim: true,
    },
    targetId: {
      type: String,
      trim: true,
    },
    targetTitle: {
      type: String,
      trim: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    collection: "user_activity_logs",
    timestamps: { createdAt: true, updatedAt: false },
  }
);

UserActivityLogSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: TTL_180_DAYS_SECONDS }
);
UserActivityLogSchema.index({ createdAt: -1 });
UserActivityLogSchema.index({ actorId: 1, createdAt: -1 });
UserActivityLogSchema.index({ ipAddress: 1, createdAt: -1 });
UserActivityLogSchema.index({ category: 1, status: 1, createdAt: -1 });
UserActivityLogSchema.index({ action: 1, createdAt: -1 });

export const UserActivityLog =
  models.UserActivityLog ||
  model<IUserActivityLog>("UserActivityLog", UserActivityLogSchema);

