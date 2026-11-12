import mongoose, { Document, Model, Schema } from "mongoose";
import {
  NEWS_CATEGORY_COLOR_TOKENS,
  type NewsCategoryColorToken,
} from "@/constants";

export interface INewsCategoryDocument extends Document {
  name: string;
  slug: string;
  description?: string;
  colorToken: NewsCategoryColorToken;
  order: number;
  isActive: boolean;
  showInSidebar: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NewsCategorySchema = new Schema<INewsCategoryDocument>(
  {
    name: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: { type: String, trim: true },
    colorToken: {
      type: String,
      enum: NEWS_CATEGORY_COLOR_TOKENS,
      default: "blue",
    },
    order: { type: Number, default: 0, index: true },
    isActive: { type: Boolean, default: true, index: true },
    showInSidebar: { type: Boolean, default: true, index: true },
  },
  { timestamps: true, collection: "news_categories" }
);

// Clear stale HMR-cached model if it predates the showInSidebar schema path
if (
  mongoose.models.NewsCategory &&
  !mongoose.models.NewsCategory.schema.path("showInSidebar")
) {
  mongoose.deleteModel("NewsCategory");
}

export const NewsCategory: Model<INewsCategoryDocument> =
  mongoose.models.NewsCategory ||
  mongoose.model<INewsCategoryDocument>("NewsCategory", NewsCategorySchema);

export default NewsCategory;

