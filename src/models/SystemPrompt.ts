import mongoose, { Schema, Document, Model, Types } from "mongoose";
import {
  DEFAULT_GEMINI_MODEL,
  SYSTEM_PROMPT_KEYS,
  SystemPromptKey,
} from "@/constants";

export interface ISystemPromptDocument extends Document {
  key: SystemPromptKey;
  name: string;
  promptContent: string;
  modelName: string;
  temperature: number;
  version: number;
  isActive: boolean;
  updatedByAdminId?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const SystemPromptSchema = new Schema<ISystemPromptDocument>(
  {
    key: {
      type: String,
      enum: Object.values(SYSTEM_PROMPT_KEYS),
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    promptContent: { type: String, required: true },
    modelName: { type: String, required: true, default: DEFAULT_GEMINI_MODEL, trim: true },
    temperature: { type: Number, required: true, min: 0, max: 2, default: 0.35 },
    version: { type: Number, required: true, min: 1, default: 1 },
    isActive: { type: Boolean, default: false, index: true },
    updatedByAdminId: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  {
    collection: "system_prompts",
    timestamps: true,
  }
);

SystemPromptSchema.index({ key: 1, version: -1 }, { unique: true });
SystemPromptSchema.index({ key: 1, isActive: 1 });

export const SystemPrompt: Model<ISystemPromptDocument> =
  mongoose.models.SystemPrompt ||
  mongoose.model<ISystemPromptDocument>("SystemPrompt", SystemPromptSchema);

export default SystemPrompt;

