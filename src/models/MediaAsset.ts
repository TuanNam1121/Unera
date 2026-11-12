import mongoose, { Schema, Document, Model, Types } from "mongoose";
import {
  CONTENT_TARGET_COLLECTIONS,
  ContentTargetCollection,
  MEDIA_ASSET_STATUS,
  MEDIA_KINDS,
  MediaAssetStatus,
  MediaKind,
} from "@/constants";

export interface IMediaUsageRef {
  targetCollection: ContentTargetCollection;
  documentId: Types.ObjectId;
  role: "COVER" | "CONTENT";
}

export interface IMediaAssetDocument extends Document {
  publicId: string;
  url: string;
  resourceType: "image" | "video";
  mediaKind: MediaKind;
  folder: string;
  originalFilename: string;
  mimeType: string;
  format: string;
  bytes: number;
  width?: number;
  height?: number;
  duration?: number;
  status: MediaAssetStatus;
  usedBy: IMediaUsageRef[];
  uploadedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const MediaUsageRefSchema = new Schema<IMediaUsageRef>(
  {
    targetCollection: {
      type: String,
      enum: Object.values(CONTENT_TARGET_COLLECTIONS),
      required: true,
    },
    documentId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    role: {
      type: String,
      enum: ["COVER", "CONTENT"],
      default: "CONTENT",
    },
  },
  { _id: false }
);

const MediaAssetSchema = new Schema<IMediaAssetDocument>(
  {
    publicId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    resourceType: {
      type: String,
      enum: ["image", "video"],
      required: true,
    },
    mediaKind: {
      type: String,
      enum: Object.values(MEDIA_KINDS),
      required: true,
      index: true,
    },
    folder: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    originalFilename: {
      type: String,
      required: true,
      trim: true,
    },
    mimeType: {
      type: String,
      required: true,
      trim: true,
    },
    format: {
      type: String,
      required: true,
      trim: true,
    },
    bytes: {
      type: Number,
      required: true,
      min: 0,
    },
    width: { type: Number },
    height: { type: Number },
    duration: { type: Number },
    status: {
      type: String,
      enum: Object.values(MEDIA_ASSET_STATUS),
      default: MEDIA_ASSET_STATUS.TEMP,
      required: true,
      index: true,
    },
    usedBy: {
      type: [MediaUsageRefSchema],
      default: [],
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "media_assets",
  }
);

MediaAssetSchema.index({ status: 1, createdAt: 1 });
MediaAssetSchema.index({ mediaKind: 1, createdAt: -1 });
MediaAssetSchema.index({
  "usedBy.targetCollection": 1,
  "usedBy.documentId": 1,
});

export const MediaAsset: Model<IMediaAssetDocument> =
  mongoose.models.MediaAsset ||
  mongoose.model<IMediaAssetDocument>("MediaAsset", MediaAssetSchema);

export default MediaAsset;

