import mongoose, { Schema, Document, Model } from "mongoose";
import { ISavedOpportunity } from "@/types";

export interface ISavedOpportunityDocument extends Omit<ISavedOpportunity, "_id">, Document {}

const SavedOpportunitySchema = new Schema<ISavedOpportunityDocument>(
  {
    studentId: { type: String, required: true, index: true },
    opportunityId: { type: Schema.Types.ObjectId, ref: "Opportunity", required: true, index: true },
  },
  {
    timestamps: true,
  }
);

// Tránh lưu trùng lặp cùng một cơ hội
SavedOpportunitySchema.index({ studentId: 1, opportunityId: 1 }, { unique: true });

export const SavedOpportunity: Model<ISavedOpportunityDocument> =
  mongoose.models.SavedOpportunity ||
  mongoose.model<ISavedOpportunityDocument>("SavedOpportunity", SavedOpportunitySchema);

export default SavedOpportunity;

