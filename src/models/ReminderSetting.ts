import mongoose, { Schema, Document, Model, Types } from "mongoose";
import { DEFAULT_REMINDER_SETTING } from "@/constants";

export interface IReminderSettingDocument extends Document {
  userId: Types.ObjectId;
  enableReminders: boolean;
  enableDeadlineReminder: boolean;
  enableEventReminder: boolean;
  offsetsDays: number[];
  channels: {
    inApp: boolean;
    email: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ReminderSettingSchema = new Schema<IReminderSettingDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    enableReminders: {
      type: Boolean,
      default: DEFAULT_REMINDER_SETTING.enableReminders,
    },
    enableDeadlineReminder: {
      type: Boolean,
      default: DEFAULT_REMINDER_SETTING.enableDeadlineReminder,
    },
    enableEventReminder: {
      type: Boolean,
      default: DEFAULT_REMINDER_SETTING.enableEventReminder,
    },
    offsetsDays: {
      type: [Number],
      default: () => [...DEFAULT_REMINDER_SETTING.offsetsDays],
    },
    channels: {
      inApp: {
        type: Boolean,
        default: DEFAULT_REMINDER_SETTING.channels.inApp,
      },
      email: {
        type: Boolean,
        default: DEFAULT_REMINDER_SETTING.channels.email,
      },
    },
  },
  {
    timestamps: true,
    collection: "reminder_settings",
  }
);

export const ReminderSetting: Model<IReminderSettingDocument> =
  mongoose.models.ReminderSetting ||
  mongoose.model<IReminderSettingDocument>(
    "ReminderSetting",
    ReminderSettingSchema
  );

export default ReminderSetting;

