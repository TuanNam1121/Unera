import mongoose, { Schema, Document, Model } from "mongoose";

export interface INewsArticleDocument extends Document {
  title: string;
  slug: string;
  summary: string;
  content: string;
  coverImage?: string;
  category: string;
  author: string;
  readTime: string;
  source?: {
    name: string;
    url?: string;
  };
  attachments?: Array<{
    name: string;
    fileUrl: string;
    fileSize: number;
  }>;
  isFeatured: boolean;
  isSponsored: boolean;
  sponsorInfo?: {
    sponsorName: string;
    sponsorLogoUrl?: string;
    targetUrl?: string;
  };
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  publishedAt?: Date;
  createdByAdminId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NewsArticleSchema = new Schema<INewsArticleDocument>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, index: true },
    summary: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    coverImage: { type: String, default: "" },
    category: {
      type: String,
      required: true,
      index: true,
      default: "ORIENTATION",
    },
    author: { type: String, default: "Ban biên tập Polaris" },
    readTime: { type: String, default: "5 phút đọc" },
    source: {
      name: { type: String, default: "Polaris Editorial" },
      url: { type: String, default: "" },
    },
    attachments: [
      {
        name: { type: String, required: true },
        fileUrl: { type: String, required: true },
        fileSize: { type: Number, default: 0 },
      },
    ],
    isFeatured: { type: Boolean, default: false, index: true },
    isSponsored: { type: Boolean, default: false, index: true },
    sponsorInfo: {
      sponsorName: { type: String, default: "" },
      sponsorLogoUrl: { type: String, default: "" },
      targetUrl: { type: String, default: "" },
    },
    status: {
      type: String,
      enum: ["DRAFT", "PUBLISHED", "ARCHIVED"],
      default: "PUBLISHED",
      index: true,
    },
    publishedAt: { type: Date, default: Date.now },
    createdByAdminId: { type: String },
  },
  {
    timestamps: true,
  }
);

export const NewsArticle: Model<INewsArticleDocument> =
  mongoose.models.NewsArticle ||
  mongoose.model<INewsArticleDocument>("NewsArticle", NewsArticleSchema);

export default NewsArticle;
