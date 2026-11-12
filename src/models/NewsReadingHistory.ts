import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface INewsReadingHistoryDocument extends Document {
  userId: Types.ObjectId;
  articleId: Types.ObjectId;
  lastReadAt: Date;
  readCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const NewsReadingHistorySchema = new Schema<INewsReadingHistoryDocument>(
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
    lastReadAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    readCount: {
      type: Number,
      default: 1,
      min: 1,
    },
  },
  {
    timestamps: true,
    collection: "news_reading_histories",
  }
);

NewsReadingHistorySchema.index({ userId: 1, articleId: 1 }, { unique: true });
NewsReadingHistorySchema.index({ userId: 1, lastReadAt: -1 });

export const NewsReadingHistory: Model<INewsReadingHistoryDocument> =
  mongoose.models.NewsReadingHistory ||
  mongoose.model<INewsReadingHistoryDocument>(
    "NewsReadingHistory",
    NewsReadingHistorySchema
  );

export default NewsReadingHistory;

