import mongoose, { Schema, Document, Model } from "mongoose";
import { ICalendarEntry } from "@/types";

export interface ICalendarEntryDocument extends Omit<ICalendarEntry, "_id">, Document {}

const CalendarEntrySchema = new Schema<ICalendarEntryDocument>(
  {
    studentId: { type: String, required: true, index: true },
    opportunityId: { type: Schema.Types.ObjectId, ref: "Opportunity", required: true, index: true },
    deadline: { type: Date, default: null },
    isActive: { type: Boolean, default: true, index: true },
    remindersSent: { type: [Number], default: [] }, // Danh sách các mốc ngày đã gửi (ví dụ: [7, 3, 1])
  },
  {
    timestamps: true,
  }
);

// Ngăn chặn trùng lặp bản ghi Calendar đang hoạt động (FR-CAL-11)
CalendarEntrySchema.index({ studentId: 1, opportunityId: 1 }, { unique: true });

export const CalendarEntry: Model<ICalendarEntryDocument> =
  mongoose.models.CalendarEntry ||
  mongoose.model<ICalendarEntryDocument>("CalendarEntry", CalendarEntrySchema);

export default CalendarEntry;
