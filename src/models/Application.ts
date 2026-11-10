import mongoose, { Schema, Document, Model } from "mongoose";
import { APPLICATION_STATUS } from "@/constants";
import { IApplicationRecord } from "@/types";

export interface IApplicationDocument extends Omit<IApplicationRecord, "_id">, Document {}

const ApplicationHistorySchema = new Schema(
  {
    status: {
      type: String,
      enum: Object.keys(APPLICATION_STATUS),
      required: true,
    },
    updatedAt: { type: Date, default: Date.now },
    note: { type: String, trim: true },
  },
  { _id: false }
);

const ApplicationSchema = new Schema<IApplicationDocument>(
  {
    studentId: { type: String, required: true, index: true },
    opportunityId: { type: Schema.Types.ObjectId, ref: "Opportunity", required: true, index: true },
    status: {
      type: String,
      enum: Object.keys(APPLICATION_STATUS),
      default: "INTERESTED",
      required: true,
      index: true,
    },
    notes: { type: String, trim: true },
    history: { type: [ApplicationHistorySchema], default: [] },
  },
  {
    timestamps: true,
  }
);

ApplicationSchema.index({ studentId: 1, opportunityId: 1 }, { unique: true });

export const Application: Model<IApplicationDocument> =
  mongoose.models.Application ||
  mongoose.model<IApplicationDocument>("Application", ApplicationSchema);

export default Application;
