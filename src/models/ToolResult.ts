import mongoose, { Document, Model, Schema, Types } from "mongoose";
import { TOOL_TYPES, type ToolType } from "@/constants";

export interface IToolResultDocument extends Document {
  userId: Types.ObjectId;
  toolType: ToolType;
  answers: Record<string, string | number>;
  resultCode: string;
  scoresBreakdown: Record<string, unknown>;
  summary: string;
  createdAt: Date;
  updatedAt: Date;
}

const ToolResultSchema = new Schema<IToolResultDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    toolType: {
      type: String,
      enum: Object.values(TOOL_TYPES),
      required: true,
    },
    answers: {
      type: Schema.Types.Mixed,
      required: true,
      default: {},
    },
    resultCode: {
      type: String,
      required: true,
      trim: true,
    },
    scoresBreakdown: {
      type: Schema.Types.Mixed,
      required: true,
      default: {},
    },
    summary: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true, collection: "tool_results" }
);

ToolResultSchema.index({ userId: 1, toolType: 1, createdAt: -1 });

// Đảm bảo HMR không giữ schema cũ khi phát triển
if (
  mongoose.models.ToolResult &&
  !mongoose.models.ToolResult.schema.path("toolType")
) {
  mongoose.deleteModel("ToolResult");
}

export const ToolResult: Model<IToolResultDocument> =
  mongoose.models.ToolResult ||
  mongoose.model<IToolResultDocument>("ToolResult", ToolResultSchema);

export default ToolResult;

