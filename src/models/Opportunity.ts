import mongoose, { Schema, Document, Model } from "mongoose";
import { OPPORTUNITY_CATEGORIES, OPPORTUNITY_STATUS } from "@/constants";
import { IOpportunity } from "@/types";

export interface IOpportunityDocument extends Omit<IOpportunity, "_id">, Document {}

const OpportunitySchema = new Schema<IOpportunityDocument>(
  {
    title: { type: String, required: true, trim: true, index: "text" },
    description: { type: String, required: true, trim: true, index: "text" },
    category: {
      type: String,
      required: true,
      enum: Object.values(OPPORTUNITY_CATEGORIES).map((c) => c.id),
      index: true,
    },
    eligibility: { type: String, trim: true },
    requirements: { type: String, trim: true },
    benefits: { type: String, trim: true },
    applicationInstructions: { type: String, trim: true },
    openingDate: { type: Date },
    deadline: { type: Date, default: null, index: true },
    location: { type: String, trim: true },
    isDomestic: { type: Boolean, default: true, index: true },
    sourceName: { type: String, trim: true },
    sourceUrl: { type: String, trim: true },
    verificationDate: { type: Date },
    status: {
      type: String,
      enum: Object.values(OPPORTUNITY_STATUS),
      default: OPPORTUNITY_STATUS.DRAFT,
      required: true,
      index: true,
    },
    isSponsored: { type: Boolean, default: false, index: true },
    version: { type: Number, default: 1, required: true }, // Optimistic locking
    updatedByAdminId: { type: String },
  },
  {
    timestamps: true,
  }
);

// Tăng version trước mỗi lần save / update khi cập nhật
OpportunitySchema.pre("save", function () {
  if (!this.isNew && this.isModified()) {
    this.version = (this.version || 1) + 1;
  }
});

export const Opportunity: Model<IOpportunityDocument> =
  mongoose.models.Opportunity ||
  mongoose.model<IOpportunityDocument>("Opportunity", OpportunitySchema);

export default Opportunity;
