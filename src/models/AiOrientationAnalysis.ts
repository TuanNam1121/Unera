import mongoose, { Schema, Document, Model, Types } from "mongoose";
import { AI_ANALYSIS_STATUS, AiAnalysisStatus } from "@/constants";
import type { IAiOrientationResultDTO, ICustomCareerOptionDTO } from "@/types";

export interface IAiOrientationAnalysisDocument extends Document {
  studentId: Types.ObjectId;
  submissionId: Types.ObjectId;
  promptVersion: number;
  modelUsed: string;
  inputSnapshot: Record<string, unknown>;
  status: AiAnalysisStatus;
  errorMessage?: string;
  retryCount: number;
  analysisResult?: IAiOrientationResultDTO | null;
  customCareerOptions?: ICustomCareerOptionDTO[];
  regenerationOfId?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const AiOrientationAnalysisSchema = new Schema<IAiOrientationAnalysisDocument>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    submissionId: {
      type: Schema.Types.ObjectId,
      ref: "AssessmentSubmission",
      required: true,
      index: true,
    },
    promptVersion: { type: Number, required: true, default: 1 },
    modelUsed: { type: String, required: true, trim: true },
    inputSnapshot: { type: Schema.Types.Mixed, default: {} },
    status: {
      type: String,
      enum: Object.values(AI_ANALYSIS_STATUS),
      default: AI_ANALYSIS_STATUS.PROCESSING,
      required: true,
      index: true,
    },
    errorMessage: { type: String, trim: true },
    retryCount: { type: Number, default: 0, min: 0 },
    analysisResult: { type: Schema.Types.Mixed, default: null },
    customCareerOptions: {
      type: [
        new Schema(
          {
            id: { type: String, required: true, trim: true },
            title: { type: String, required: true, trim: true },
            reason: { type: String, trim: true, default: "" },
            createdAt: { type: String, trim: true },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
    regenerationOfId: {
      type: Schema.Types.ObjectId,
      ref: "AiOrientationAnalysis",
      default: null,
    },
  },
  {
    collection: "ai_orientation_analyses",
    timestamps: true,
  }
);

AiOrientationAnalysisSchema.index({ studentId: 1, createdAt: -1 });
AiOrientationAnalysisSchema.index({ submissionId: 1, createdAt: -1 });

export const AiOrientationAnalysis: Model<IAiOrientationAnalysisDocument> =
  mongoose.models.AiOrientationAnalysis ||
  mongoose.model<IAiOrientationAnalysisDocument>(
    "AiOrientationAnalysis",
    AiOrientationAnalysisSchema
  );

export default AiOrientationAnalysis;

