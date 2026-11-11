import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRecommendedDirection {
  direction: string;
  title: string;
  score: number;
  description: string;
  suggestedNextSteps: string[];
}

export interface IQuizResultDocument extends Document {
  studentId: string;
  answers: Map<string, string>;
  scores: {
    study_abroad: number;
    employment: number;
    research: number;
    startup: number;
    skills: number;
  };
  recommendedDirections: IRecommendedDirection[];
  createdAt: Date;
  updatedAt: Date;
}

const RecommendedDirectionSchema = new Schema(
  {
    direction: { type: String, required: true },
    title: { type: String, required: true },
    score: { type: Number, required: true },
    description: { type: String, required: true },
    suggestedNextSteps: { type: [String], default: [] },
  },
  { _id: false }
);

const QuizResultSchema = new Schema<IQuizResultDocument>(
  {
    studentId: { type: String, required: true, index: true },
    answers: { type: Map, of: String, default: {} },
    scores: {
      study_abroad: { type: Number, default: 0 },
      employment: { type: Number, default: 0 },
      research: { type: Number, default: 0 },
      startup: { type: Number, default: 0 },
      skills: { type: Number, default: 0 },
    },
    recommendedDirections: { type: [RecommendedDirectionSchema], default: [] },
  },
  {
    timestamps: true,
  }
);

export const QuizResult: Model<IQuizResultDocument> =
  mongoose.models.QuizResult ||
  mongoose.model<IQuizResultDocument>("QuizResult", QuizResultSchema);

export default QuizResult;

