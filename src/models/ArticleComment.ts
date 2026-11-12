import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IArticleCommentDocument extends Document {
  articleId: Types.ObjectId;
  userId: Types.ObjectId;
  authorName: string;
  authorAvatar: string;
  authorUniversity?: string;
  authorMajor?: string;
  parentCommentId: Types.ObjectId | null;
  content: string;
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ArticleCommentSchema = new Schema<IArticleCommentDocument>(
  {
    articleId: {
      type: Schema.Types.ObjectId,
      ref: "OrientationArticle",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    authorName: { type: String, required: true, trim: true, maxlength: 120 },
    authorAvatar: { type: String, trim: true, default: "" },
    authorUniversity: { type: String, trim: true, default: "" },
    authorMajor: { type: String, trim: true, default: "" },
    parentCommentId: {
      type: Schema.Types.ObjectId,
      ref: "ArticleComment",
      default: null,
      index: true,
    },
    content: { type: String, required: true, trim: true, maxlength: 1000 },
    isEdited: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
  },
  {
    collection: "article_comments",
    timestamps: true,
  }
);

ArticleCommentSchema.index({ articleId: 1, parentCommentId: 1, createdAt: -1 });

export const ArticleComment: Model<IArticleCommentDocument> =
  mongoose.models.ArticleComment ||
  mongoose.model<IArticleCommentDocument>(
    "ArticleComment",
    ArticleCommentSchema
  );

export default ArticleComment;

