import mongoose, { Schema, Document, Model } from "mongoose";

export interface IQuizOption {
  id: string;
  text: string;
  scores: {
    study_abroad?: number;
    employment?: number;
    research?: number;
    startup?: number;
    skills?: number;
  };
}

export interface IQuizQuestionDocument extends Document {
  question: string;
  category: string;
  order: number;
  isActive: boolean;
  options: IQuizOption[];
  createdAt: Date;
  updatedAt: Date;
}

const QuizOptionSchema = new Schema(
  {
    id: { type: String, required: true },
    text: { type: String, required: true, trim: true },
    scores: {
      study_abroad: { type: Number, default: 0 },
      employment: { type: Number, default: 0 },
      research: { type: Number, default: 0 },
      startup: { type: Number, default: 0 },
      skills: { type: Number, default: 0 },
    },
  },
  { _id: false }
);

const QuizQuestionSchema = new Schema<IQuizQuestionDocument>(
  {
    question: { type: String, required: true, trim: true },
    category: { type: String, default: "GENERAL", trim: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
    options: { type: [QuizOptionSchema], default: [] },
  },
  {
    timestamps: true,
  }
);

export const QuizQuestion: Model<IQuizQuestionDocument> =
  mongoose.models.QuizQuestion ||
  mongoose.model<IQuizQuestionDocument>("QuizQuestion", QuizQuestionSchema);

export default QuizQuestion;

