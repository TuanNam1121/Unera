import mongoose, { Schema, Document, Model } from "mongoose";
import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_TYPES,
  REMINDER_TYPES,
} from "@/constants";
import { INotification } from "@/types";

export interface INotificationDocument
  extends Omit<INotification, "_id">,
    Document {}

const NotificationSchema = new Schema<INotificationDocument>(
  {
    recipientId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: Object.values(NOTIFICATION_TYPES),
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    link: { type: String, trim: true },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date, default: null },
    channel: {
      type: String,
      enum: Object.values(NOTIFICATION_CHANNELS),
      default: NOTIFICATION_CHANNELS.IN_APP,
      required: true,
    },
    emailDeliveryStatus: {
      type: String,
      enum: ["PENDING", "SENT", "FAILED"],
      default: "PENDING",
    },
    activityId: { type: String },
    reminderType: {
      type: String,
      enum: Object.values(REMINDER_TYPES),
    },
    reminderOffsetDays: { type: Number },
    idempotencyKey: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Idempotency key duy nhất cho từng mốc nhắc của từng hoạt động & ngày mục tiêu
NotificationSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });
NotificationSchema.index({ recipientId: 1, channel: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ recipientId: 1, type: 1, createdAt: -1 });

export const Notification: Model<INotificationDocument> =
  mongoose.models.Notification ||
  mongoose.model<INotificationDocument>("Notification", NotificationSchema);

export default Notification;
