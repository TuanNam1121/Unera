import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface INewsBookmarkDocument extends Document {
  userId: Types.ObjectId;
  articleId: Types.ObjectId;
  createdAt: Date;
}

const NewsBookmarkSchema = new Schema<INewsBookmarkDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    articleId: {
      type: Schema.Types.ObjectId,
      ref: "NewsArticle",
      required: true,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: "news_bookmarks",
  }
);

NewsBookmarkSchema.index({ userId: 1, articleId: 1 }, { unique: true });

export const NewsBookmark: Model<INewsBookmarkDocument> =
  mongoose.models.NewsBookmark ||
  mongoose.model<INewsBookmarkDocument>("NewsBookmark", NewsBookmarkSchema);

export default NewsBookmark;

