import mongoose, { Schema, Document, Model, Types } from "mongoose";
import {
  ORIENTATION_ARTICLE_STATUS,
  OrientationArticleStatus,
} from "@/constants";
import type { TiptapJSONDoc } from "@/types";

export interface IOrientationArticleDocument extends Document {
  title: string;
  slug: string;
  summary: string;
  contentJson: TiptapJSONDoc;
  contentText: string;
  coverImage: string;
  categoryId: Types.ObjectId;
  topicIds: Types.ObjectId[];
  tags: string[];
  status: OrientationArticleStatus;
  isFeatured: boolean;
  authorName: string;
  createdByAdminId?: Types.ObjectId | null;
  readTimeMinutes: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const OrientationArticleSchema = new Schema<IOrientationArticleDocument>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 240,
    },
    summary: { type: String, required: true, trim: true, maxlength: 500 },
    contentJson: { type: Schema.Types.Mixed, required: true },
    contentText: { type: String, default: "" },
    coverImage: { type: String, trim: true, default: "" },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "OrientationCategory",
      required: true,
      index: true,
    },
    topicIds: {
      type: [{ type: Schema.Types.ObjectId, ref: "OrientationTopic" }],
      default: [],
      index: true,
    },
    tags: { type: [String], default: [] },
    status: {
      type: String,
      enum: Object.values(ORIENTATION_ARTICLE_STATUS),
      default: ORIENTATION_ARTICLE_STATUS.DRAFT,
      required: true,
      index: true,
    },
    isFeatured: { type: Boolean, default: false, index: true },
    authorName: {
      type: String,
      required: true,
      trim: true,
      default: "Ban biên tập Unera",
    },
    createdByAdminId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
      default: null,
    },
    readTimeMinutes: { type: Number, default: 5, min: 1 },
    viewCount: { type: Number, default: 0, min: 0 },
    likeCount: { type: Number, default: 0, min: 0 },
    commentCount: { type: Number, default: 0, min: 0 },
    publishedAt: { type: Date, default: null, index: true },
  },
  {
    timestamps: true,
    collection: "orientation_articles",
  }
);

OrientationArticleSchema.index({ status: 1, isFeatured: -1, publishedAt: -1 });
OrientationArticleSchema.index({ status: 1, categoryId: 1, publishedAt: -1 });
OrientationArticleSchema.index({ status: 1, viewCount: -1, publishedAt: -1 });
OrientationArticleSchema.index({ status: 1, likeCount: -1, publishedAt: -1 });
OrientationArticleSchema.index(
  {
    title: "text",
    summary: "text",
    tags: "text",
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
    name: "orientation_article_text_search",
  }
);

export const OrientationArticle: Model<IOrientationArticleDocument> =
  mongoose.models.OrientationArticle ||
  mongoose.model<IOrientationArticleDocument>(
    "OrientationArticle",
    OrientationArticleSchema
  );

export default OrientationArticle;

