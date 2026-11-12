import mongoose, { Document, Model, Schema, Types } from "mongoose";
import { NEWS_ARTICLE_STATUS, type NewsArticleStatus } from "@/constants";
import type { TiptapJSONDoc } from "@/types";

export interface INewsArticleDocument extends Document {
  title: string;
  slug: string;
  summary: string;
  contentJson: TiptapJSONDoc;
  contentText: string;
  coverImage?: string;
  categoryId: Types.ObjectId;
  category: string;
  tags: string[];
  authorName: string;
  readTimeMinutes: number;
  status: NewsArticleStatus;
  scheduledAt?: Date | null;
  publishedAt?: Date | null;
  isFeatured: boolean;
  isSponsored: boolean;
  sponsorInfo?: string;
  sourceName?: string;
  sourceUrl?: string;
  viewCount: number;
  bookmarkCount: number;
  shareCount: number;
  version: number;
  createdBy?: Types.ObjectId;
  updatedByAdminId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const NewsArticleSchema = new Schema<INewsArticleDocument>(
  {
    title: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    summary: { type: String, required: true, trim: true },
    contentJson: { type: Schema.Types.Mixed, required: true },
    contentText: { type: String, default: "" },
    coverImage: { type: String, trim: true },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "NewsCategory",
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    tags: [{ type: String, trim: true }],
    authorName: {
      type: String,
      default: "Ban biên tập Unera",
      trim: true,
    },
    readTimeMinutes: { type: Number, default: 3, min: 1 },
    status: {
      type: String,
      enum: Object.values(NEWS_ARTICLE_STATUS),
      default: NEWS_ARTICLE_STATUS.DRAFT,
      index: true,
    },
    scheduledAt: { type: Date, default: null, index: true },
    publishedAt: { type: Date, default: null, index: true },
    isFeatured: { type: Boolean, default: false, index: true },
    isSponsored: { type: Boolean, default: false },
    sponsorInfo: { type: String, trim: true },
    sourceName: { type: String, trim: true },
    sourceUrl: { type: String, trim: true },
    viewCount: { type: Number, default: 0, min: 0 },
    bookmarkCount: { type: Number, default: 0, min: 0 },
    shareCount: { type: Number, default: 0, min: 0 },
    version: { type: Number, default: 1, min: 1 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedByAdminId: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, collection: "news_articles" }
);

NewsArticleSchema.index({ tags: 1 });
NewsArticleSchema.index({ status: 1, publishedAt: -1 });
NewsArticleSchema.index({ status: 1, viewCount: -1, bookmarkCount: -1, shareCount: -1 });
NewsArticleSchema.index({ status: 1, scheduledAt: 1 });
NewsArticleSchema.index({ category: 1, status: 1, publishedAt: -1 });
NewsArticleSchema.index(
  {
    title: "text",
    tags: "text",
    summary: "text",
    authorName: "text",
    contentText: "text",
  },
  {
    weights: {
      title: 10,
      tags: 6,
      summary: 4,
      authorName: 3,
      contentText: 1,
    },
    default_language: "none",
    name: "news_article_text_search",
  }
);

export const NewsArticle: Model<INewsArticleDocument> =
  mongoose.models.NewsArticle ||
  mongoose.model<INewsArticleDocument>("NewsArticle", NewsArticleSchema);

export default NewsArticle;

