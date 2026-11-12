import mongoose, { Schema, Document, Model, Types } from "mongoose";
import {
  ASSESSMENT_QUESTION_TYPES,
  AssessmentQuestionType,
  CONDITION_MATCH_TYPES,
  CONDITION_OPERATORS,
  ConditionMatchType,
  ConditionOperator,
} from "@/constants";

export interface IAssessmentQuestionOption {
  id: string;
  label: string;
  value: string;
  order: number;
}

export interface IAssessmentScaleConfig {
  min: number;
  max: number;
  step: number;
  minLabel: string;
  maxLabel: string;
}

export interface IAssessmentTextConfig {
  placeholder: string;
  maxLength: number;
  multiline: boolean;
}

export interface IAssessmentMultipleConfig {
  minSelect?: number;
  maxSelect?: number;
}

export interface IAssessmentConditionRule {
  sourceQuestionId: string;
  operator: ConditionOperator;
  value: string | number;
}

export interface IAssessmentConditionalLogic {
  enabled: boolean;
  matchType: ConditionMatchType;
  rules: IAssessmentConditionRule[];
}

export interface IAssessmentQuestionDocument extends Document {
  questionnaireId: Types.ObjectId;
  code: string;
  questionText: string;
  description?: string;
  questionType: AssessmentQuestionType;
  isRequired: boolean;
  allowCustomOption?: boolean;
  order: number;
  options: IAssessmentQuestionOption[];
  scaleConfig?: IAssessmentScaleConfig;
  textConfig?: IAssessmentTextConfig;
  multipleConfig?: IAssessmentMultipleConfig;
  conditionalLogic?: IAssessmentConditionalLogic | null;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionOptionSchema = new Schema<IAssessmentQuestionOption>(
  {
    id: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true },
    order: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const ConditionRuleSchema = new Schema<IAssessmentConditionRule>(
  {
    sourceQuestionId: { type: String, required: true, trim: true },
    operator: {
      type: String,
      enum: Object.values(CONDITION_OPERATORS),
      required: true,
    },
    value: { type: Schema.Types.Mixed, required: true },
  },
  { _id: false }
);

const ConditionalLogicSchema = new Schema<IAssessmentConditionalLogic>(
  {
    enabled: { type: Boolean, default: false },
    matchType: {
      type: String,
      enum: Object.values(CONDITION_MATCH_TYPES),
      default: CONDITION_MATCH_TYPES.ALL,
    },
    rules: { type: [ConditionRuleSchema], default: [] },
  },
  { _id: false }
);

const AssessmentQuestionSchema = new Schema<IAssessmentQuestionDocument>(
  {
    questionnaireId: {
      type: Schema.Types.ObjectId,
      ref: "Questionnaire",
      required: true,
      index: true,
    },
    code: { type: String, required: true, trim: true },
    questionText: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    questionType: {
      type: String,
      enum: Object.values(ASSESSMENT_QUESTION_TYPES),
      required: true,
    },
    isRequired: { type: Boolean, default: true },
    allowCustomOption: { type: Boolean, default: true },
    order: { type: Number, required: true, min: 1 },
    options: { type: [QuestionOptionSchema], default: [] },
    scaleConfig: {
      type: new Schema(
        {
          min: { type: Number, default: 1 },
          max: { type: Number, default: 5 },
          step: { type: Number, default: 1 },
          minLabel: { type: String, default: "Hoàn toàn không đồng ý" },
          maxLabel: { type: String, default: "Rất đồng ý" },
        },
        { _id: false }
      ),
      default: undefined,
    },
    textConfig: {
      type: new Schema(
        {
          placeholder: { type: String, default: "Nhập câu trả lời của bạn..." },
          maxLength: { type: Number, default: 1000 },
          multiline: { type: Boolean, default: true },
        },
        { _id: false }
      ),
      default: undefined,
    },
    multipleConfig: {
      type: new Schema(
        {
          minSelect: { type: Number },
          maxSelect: { type: Number },
        },
        { _id: false }
      ),
      default: undefined,
    },
    conditionalLogic: {
      type: ConditionalLogicSchema,
      default: null,
    },
  },
  {
    collection: "assessment_questions",
    timestamps: true,
  }
);

AssessmentQuestionSchema.index({ questionnaireId: 1, order: 1 });
AssessmentQuestionSchema.index({ questionnaireId: 1, code: 1 }, { unique: true });

export const AssessmentQuestion: Model<IAssessmentQuestionDocument> =
  mongoose.models.AssessmentQuestion ||
  mongoose.model<IAssessmentQuestionDocument>(
    "AssessmentQuestion",
    AssessmentQuestionSchema
  );

export default AssessmentQuestion;

