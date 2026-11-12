import mongoose, { Schema, Document, Model, Types } from "mongoose";
import {
  ASSESSMENT_QUESTION_TYPES,
  ASSESSMENT_SUBMISSION_STATUS,
  AssessmentQuestionType,
  AssessmentSubmissionStatus,
} from "@/constants";
import type { AssessmentAnswerValue } from "@/types";

export interface IAssessmentSubmissionAnswer {
  questionId: string;
  questionCode: string;
  questionTextSnapshot: string;
  questionType: AssessmentQuestionType;
  value: AssessmentAnswerValue;
}

export interface IAssessmentSubmissionDocument extends Document {
  studentId: Types.ObjectId;
  questionnaireId: Types.ObjectId;
  status: AssessmentSubmissionStatus;
  attemptNumber: number;
  answers: IAssessmentSubmissionAnswer[];
  currentStepIndex: number;
  lastSavedAt?: Date | null;
  submittedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const SubmissionAnswerSchema = new Schema<IAssessmentSubmissionAnswer>(
  {
    questionId: { type: String, required: true },
    questionCode: { type: String, required: true },
    questionTextSnapshot: { type: String, required: true },
    questionType: {
      type: String,
      enum: Object.values(ASSESSMENT_QUESTION_TYPES),
      required: true,
    },
    value: { type: Schema.Types.Mixed, required: true },
  },
  { _id: false }
);

const AssessmentSubmissionSchema = new Schema<IAssessmentSubmissionDocument>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    questionnaireId: {
      type: Schema.Types.ObjectId,
      ref: "Questionnaire",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(ASSESSMENT_SUBMISSION_STATUS),
      default: ASSESSMENT_SUBMISSION_STATUS.IN_PROGRESS,
      required: true,
      index: true,
    },
    attemptNumber: { type: Number, required: true, min: 1, default: 1 },
    answers: { type: [SubmissionAnswerSchema], default: [] },
    currentStepIndex: { type: Number, default: 0, min: 0 },
    lastSavedAt: { type: Date, default: null },
    submittedAt: { type: Date, default: null },
  },
  {
    collection: "assessment_submissions",
    timestamps: true,
  }
);

AssessmentSubmissionSchema.index({ studentId: 1, status: 1, submittedAt: -1 });
AssessmentSubmissionSchema.index({ studentId: 1, questionnaireId: 1, attemptNumber: -1 });

export const AssessmentSubmission: Model<IAssessmentSubmissionDocument> =
  mongoose.models.AssessmentSubmission ||
  mongoose.model<IAssessmentSubmissionDocument>(
    "AssessmentSubmission",
    AssessmentSubmissionSchema
  );

export default AssessmentSubmission;

