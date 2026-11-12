import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IArticleLikeDocument extends Document {
  articleId: Types.ObjectId;
  userId: Types.ObjectId;
  createdAt: Date;
}

const ArticleLikeSchema = new Schema<IArticleLikeDocument>(
  {
    articleId: {
      type: Schema.Types.ObjectId,
      ref: "OrientationArticle",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  {
    collection: "article_likes",
    timestamps: { createdAt: true, updatedAt: false },
  }
);

ArticleLikeSchema.index({ articleId: 1, userId: 1 }, { unique: true });

export const ArticleLike: Model<IArticleLikeDocument> =
  mongoose.models.ArticleLike ||
  mongoose.model<IArticleLikeDocument>("ArticleLike", ArticleLikeSchema);

export default ArticleLike;

