import mongoose, { Schema, Document, Model } from "mongoose";

export interface IOrientationCategoryDocument extends Document {
  name: string;
  slug: string;
  description: string;
  icon: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const OrientationCategorySchema = new Schema<IOrientationCategoryDocument>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 120,
    },
    description: { type: String, trim: true, default: "", maxlength: 500 },
    icon: { type: String, trim: true, default: "Compass", maxlength: 50 },
    order: { type: Number, default: 0, index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  {
    collection: "orientation_categories",
    timestamps: true,
  }
);

OrientationCategorySchema.index({ isActive: 1, order: 1, createdAt: 1 });

export const OrientationCategory: Model<IOrientationCategoryDocument> =
  mongoose.models.OrientationCategory ||
  mongoose.model<IOrientationCategoryDocument>(
    "OrientationCategory",
    OrientationCategorySchema
  );

export default OrientationCategory;

