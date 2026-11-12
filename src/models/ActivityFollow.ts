import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IActivityFollowDocument extends Document {
  studentId: Types.ObjectId;
  activityId: Types.ObjectId;
  notifyDeadline: boolean;
  notifyEvent: boolean;
  createdAt: Date;
}

const ActivityFollowSchema = new Schema<IActivityFollowDocument>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    activityId: {
      type: Schema.Types.ObjectId,
      ref: "StudentActivity",
      required: true,
      index: true,
    },
    notifyDeadline: { type: Boolean, default: true },
    notifyEvent: { type: Boolean, default: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: "activity_follows",
  }
);

ActivityFollowSchema.index({ studentId: 1, activityId: 1 }, { unique: true });

export const ActivityFollow: Model<IActivityFollowDocument> =
  mongoose.models.ActivityFollow ||
  mongoose.model<IActivityFollowDocument>(
    "ActivityFollow",
    ActivityFollowSchema
  );

export default ActivityFollow;

