import mongoose, { Schema, Document, Model } from "mongoose";
import { BOOKING_STATUS } from "@/constants";
import { IBookingRequest } from "@/types";

export interface IBookingRequestDocument extends Omit<IBookingRequest, "_id">, Document {}

const BookingRequestSchema = new Schema<IBookingRequestDocument>(
  {
    studentId: { type: String, required: true, index: true },
    mentorId: { type: Schema.Types.ObjectId, ref: "MentorProfile", required: true, index: true },
    topic: { type: String, required: true, trim: true },
    preferredTime: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: Object.keys(BOOKING_STATUS),
      default: "PENDING",
      required: true,
      index: true,
    },
    adminResponse: { type: String, trim: true },
    processedByAdminId: { type: String },
  },
  {
    timestamps: true,
  }
);

export const BookingRequest: Model<IBookingRequestDocument> =
  mongoose.models.BookingRequest ||
  mongoose.model<IBookingRequestDocument>("BookingRequest", BookingRequestSchema);

export default BookingRequest;

