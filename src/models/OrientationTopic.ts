import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IOrientationTopicDocument extends Document {
  categoryId: Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const OrientationTopicSchema = new Schema<IOrientationTopicDocument>(
  {
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "OrientationCategory",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 120,
    },
    description: { type: String, trim: true, default: "", maxlength: 500 },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
  },
  {
    collection: "orientation_topics",
    timestamps: true,
  }
);

OrientationTopicSchema.index({ categoryId: 1, slug: 1 }, { unique: true });
OrientationTopicSchema.index({ categoryId: 1, isActive: 1, order: 1 });

export const OrientationTopic: Model<IOrientationTopicDocument> =
  mongoose.models.OrientationTopic ||
  mongoose.model<IOrientationTopicDocument>(
    "OrientationTopic",
    OrientationTopicSchema
  );

export default OrientationTopic;

