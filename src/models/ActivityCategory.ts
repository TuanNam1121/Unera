import mongoose, { Document, Model, Schema } from "mongoose";
import { ACTIVITY_CATEGORY_COLOR_TOKENS } from "@/constants";

export interface IActivityCategoryDocument extends Document {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  colorToken: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ActivityCategorySchema = new Schema<IActivityCategoryDocument>(
  {
    name: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: { type: String, trim: true },
    icon: { type: String, trim: true },
    colorToken: {
      type: String,
      enum: ACTIVITY_CATEGORY_COLOR_TOKENS,
      default: "blue",
    },
    order: { type: Number, default: 0, index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
    collection: "activity_categories",
  }
);

ActivityCategorySchema.index({ isActive: 1, order: 1 });

export const ActivityCategory: Model<IActivityCategoryDocument> =
  mongoose.models.ActivityCategory ||
  mongoose.model<IActivityCategoryDocument>(
    "ActivityCategory",
    ActivityCategorySchema
  );

export default ActivityCategory;

