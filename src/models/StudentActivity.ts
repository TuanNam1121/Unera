import mongoose, { Document, Model, Schema, Types } from "mongoose";
import { ACTIVITY_PUBLISH_STATUS, ActivityPublishStatus } from "@/constants";
import type { TiptapJSONDoc } from "@/types";

export interface IStudentActivityDocument extends Document {
  title: string;
  slug: string;
  summary: string;
  contentJson: TiptapJSONDoc;
  contentText: string;
  coverImage?: string;
  categoryId: Types.ObjectId;
  organizer?: string;
  location?: string;
  isDomestic: boolean;
  eligibility?: string;
  requirements?: string;
  benefits?: string;
  applicationInstructions?: string;
  openingDate?: Date | null;
  deadline?: Date | null;
  eventDate?: Date | null;
  eventEndDate?: Date | null;
  registrationUrl?: string;
  tags: string[];
  publishStatus: ActivityPublishStatus;
  manualClosed: boolean;
  isFeatured: boolean;
  followerCount: number;
  viewCount: number;
  publishedAt?: Date | null;
  version: number;
  createdBy?: Types.ObjectId;
  updatedByAdminId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const StudentActivitySchema = new Schema<IStudentActivityDocument>(
  {
    title: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    summary: { type: String, required: true, trim: true },
    contentJson: { type: Schema.Types.Mixed, required: true },
    contentText: { type: String, default: "" },
    coverImage: { type: String, trim: true },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "ActivityCategory",
      required: true,
      index: true,
    },
    organizer: { type: String, trim: true },
    location: { type: String, trim: true },
    isDomestic: { type: Boolean, default: true },
    eligibility: { type: String, trim: true },
    requirements: { type: String, trim: true },
    benefits: { type: String, trim: true },
    applicationInstructions: { type: String, trim: true },
    openingDate: { type: Date, default: null },
    deadline: { type: Date, default: null, index: true },
    eventDate: { type: Date, default: null, index: true },
    eventEndDate: { type: Date, default: null },
    registrationUrl: { type: String, trim: true },
    tags: [{ type: String, trim: true }],
    publishStatus: {
      type: String,
      enum: Object.values(ACTIVITY_PUBLISH_STATUS),
      default: ACTIVITY_PUBLISH_STATUS.DRAFT,
      index: true,
    },
    manualClosed: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false, index: true },
    followerCount: { type: Number, default: 0, min: 0, index: true },
    viewCount: { type: Number, default: 0, min: 0 },
    publishedAt: { type: Date, default: null },
    version: { type: Number, default: 1, min: 1 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedByAdminId: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
    collection: "student_activities",
  }
);

StudentActivitySchema.index({ publishStatus: 1, deadline: 1, eventDate: 1 });
StudentActivitySchema.index({ categoryId: 1, publishStatus: 1 });
StudentActivitySchema.index({ publishStatus: 1, followerCount: -1 });
StudentActivitySchema.index({ publishStatus: 1, publishedAt: -1 });
StudentActivitySchema.index({ createdAt: -1 });
StudentActivitySchema.index(
  {
    title: "text",
    tags: "text",
    organizer: "text",
    location: "text",
    summary: "text",
    contentText: "text",
  },
  {
    weights: {
      title: 10,
      tags: 6,
      organizer: 5,
      location: 4,
      summary: 4,
      contentText: 1,
    },
    default_language: "none",
    name: "student_activity_text_search",
  }
);

export const StudentActivity: Model<IStudentActivityDocument> =
  mongoose.models.StudentActivity ||
  mongoose.model<IStudentActivityDocument>(
    "StudentActivity",
    StudentActivitySchema
  );

export default StudentActivity;

