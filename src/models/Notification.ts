import mongoose, { Schema, Document, Model } from "mongoose";
import { INotification } from "@/types";

export interface INotificationDocument extends Omit<INotification, "_id">, Document {}

const NotificationSchema = new Schema<INotificationDocument>(
  {
    recipientId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ["DEADLINE_REMINDER", "BOOKING_UPDATE", "ROADMAP_UPDATE", "SYSTEM_ANNOUNCEMENT"],
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    link: { type: String, trim: true },
    isRead: { type: Boolean, default: false, index: true },
    channel: {
      type: String,
      enum: ["IN_APP", "EMAIL"],
      default: "IN_APP",
      required: true,
    },
    emailDeliveryStatus: {
      type: String,
      enum: ["PENDING", "SENT", "FAILED"],
      default: "PENDING",
    },
    opportunityId: { type: String },
    reminderOffsetDays: { type: Number },
  },
  {
    timestamps: true,
  }
);

// Ngăn chặn thông báo trùng lặp cho cùng một cơ hội và mốc ngày nhắc hẹn (FR-NOTI-06)
NotificationSchema.index(
  { recipientId: 1, opportunityId: 1, reminderOffsetDays: 1, channel: 1 },
  {
    unique: true,
    sparse: true,
  }
);

export const Notification: Model<INotificationDocument> =
  mongoose.models.Notification ||
  mongoose.model<INotificationDocument>("Notification", NotificationSchema);

export default Notification;

