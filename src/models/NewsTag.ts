import mongoose, { Document, Model, Schema } from "mongoose";

export interface INewsTagDocument extends Document {
  name: string;
  slug: string;
  usageCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NewsTagSchema = new Schema<INewsTagDocument>(
  {
    name: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    usageCount: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true, collection: "news_tags" }
);

export const NewsTag: Model<INewsTagDocument> =
  mongoose.models.NewsTag ||
  mongoose.model<INewsTagDocument>("NewsTag", NewsTagSchema);

export default NewsTag;

