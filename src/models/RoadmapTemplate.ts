import mongoose, { Schema, Document, Model } from "mongoose";
import { IRoadmapTemplate } from "@/types";

export interface IRoadmapTemplateDocument extends Omit<IRoadmapTemplate, "_id">, Document {}

const RoadmapTemplateSchema = new Schema<IRoadmapTemplateDocument>(
  {
    title: { type: String, required: true, trim: true },
    direction: { type: String, required: true, trim: true }, // e.g., "Du học", "Thực tập MNC", "Nghiên cứu khoa học"
    description: { type: String, trim: true },
    structure: { type: Schema.Types.Mixed, default: [] },
    isActive: { type: Boolean, default: true, index: true },
    createdByAdminId: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

export const RoadmapTemplate: Model<IRoadmapTemplateDocument> =
  mongoose.models.RoadmapTemplate ||
  mongoose.model<IRoadmapTemplateDocument>("RoadmapTemplate", RoadmapTemplateSchema);

export default RoadmapTemplate;
