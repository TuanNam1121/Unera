import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IQuestionnaireDocument extends Document {
  title: string;
  description?: string;
  version: number;
  isActive: boolean;
  isDeleted: boolean;
  createdByAdminId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionnaireSchema = new Schema<IQuestionnaireDocument>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    version: { type: Number, default: 1, min: 1 },
    isActive: { type: Boolean, default: false, index: true },
    isDeleted: { type: Boolean, default: false, index: true },
    createdByAdminId: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

QuestionnaireSchema.index({ isDeleted: 1, isActive: 1 });

export const Questionnaire: Model<IQuestionnaireDocument> =
  mongoose.models.Questionnaire ||
  mongoose.model<IQuestionnaireDocument>("Questionnaire", QuestionnaireSchema);

export default Questionnaire;

