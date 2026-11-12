import mongoose, { Schema, Document, Model, Types } from "mongoose";
import {
  ROADMAP_GOAL_CATEGORIES,
  ROADMAP_GOAL_PRIORITIES,
  ROADMAP_GOAL_STATUSES,
  ROADMAP_SOURCE,
  ROADMAP_STATUS,
  RoadmapGoalCategory,
  RoadmapGoalPriority,
  RoadmapGoalStatus,
  RoadmapSource,
  RoadmapStatus,
} from "@/constants";

export interface IRoadmapGoalSubdoc {
  id: string;
  title: string;
  description: string;
  category: RoadmapGoalCategory;
  semester: 0 | 1 | 2;
  priority: RoadmapGoalPriority;
  status: RoadmapGoalStatus;
  dueDate: Date | null;
  order: number;
  isCustom: boolean;
  completedAt: Date | null;
}

export interface IRoadmapYearSubdoc {
  yearNumber: 1 | 2 | 3 | 4;
  title: string;
  summary: string;
  goals: IRoadmapGoalSubdoc[];
}

export interface IRoadmapDocument extends Document {
  studentId: Types.ObjectId;
  analysisId?: Types.ObjectId | null;
  title: string;
  orientationDirection: string;
  version: number;
  status: RoadmapStatus;
  source: RoadmapSource;
  restoredFromRoadmapId?: Types.ObjectId | null;
  progressPercent: number;
  years: IRoadmapYearSubdoc[];
  createdAt: Date;
  updatedAt: Date;
}

const RoadmapGoalSchema = new Schema<IRoadmapGoalSubdoc>(
  {
    id: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    category: {
      type: String,
      enum: Object.values(ROADMAP_GOAL_CATEGORIES),
      default: ROADMAP_GOAL_CATEGORIES.SKILL,
      required: true,
    },
    semester: {
      type: Number,
      enum: [0, 1, 2],
      default: 0,
      required: true,
    },
    priority: {
      type: String,
      enum: Object.values(ROADMAP_GOAL_PRIORITIES),
      default: ROADMAP_GOAL_PRIORITIES.MEDIUM,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(ROADMAP_GOAL_STATUSES),
      default: ROADMAP_GOAL_STATUSES.NOT_STARTED,
      required: true,
    },
    dueDate: { type: Date, default: null },
    order: { type: Number, required: true, min: 1 },
    isCustom: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
  },
  { _id: false }
);

const RoadmapYearSchema = new Schema<IRoadmapYearSubdoc>(
  {
    yearNumber: {
      type: Number,
      enum: [1, 2, 3, 4],
      required: true,
    },
    title: { type: String, required: true, trim: true },
    summary: { type: String, trim: true, default: "" },
    goals: { type: [RoadmapGoalSchema], default: [] },
  },
  { _id: false }
);

const RoadmapSchema = new Schema<IRoadmapDocument>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    analysisId: {
      type: Schema.Types.ObjectId,
      ref: "AiOrientationAnalysis",
      default: null,
    },
    title: { type: String, required: true, trim: true },
    orientationDirection: { type: String, required: true, trim: true },
    version: { type: Number, required: true, min: 1, default: 1 },
    status: {
      type: String,
      enum: Object.values(ROADMAP_STATUS),
      default: ROADMAP_STATUS.ACTIVE,
      required: true,
      index: true,
    },
    source: {
      type: String,
      enum: Object.values(ROADMAP_SOURCE),
      default: ROADMAP_SOURCE.AI_GENERATED,
      required: true,
    },
    restoredFromRoadmapId: {
      type: Schema.Types.ObjectId,
      ref: "Roadmap",
      default: null,
    },
    progressPercent: { type: Number, default: 0, min: 0, max: 100 },
    years: { type: [RoadmapYearSchema], default: [] },
  },
  {
    collection: "roadmaps",
    timestamps: true,
  }
);

// Đảm bảo tối đa chỉ có 1 Roadmap ACTIVE cho mỗi studentId
RoadmapSchema.index(
  { studentId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: ROADMAP_STATUS.ACTIVE },
    name: "unique_active_roadmap_per_student",
  }
);
RoadmapSchema.index({ studentId: 1, version: -1 });

// Dev HMR cache guard khi nâng cấp schema Roadmap từ cấu trúc cũ sang cấu trúc mới
if (
  process.env.NODE_ENV !== "production" &&
  mongoose.models.Roadmap &&
  !mongoose.models.Roadmap.schema.path("orientationDirection")
) {
  mongoose.deleteModel("Roadmap");
}

export const Roadmap: Model<IRoadmapDocument> =
  mongoose.models.Roadmap ||
  mongoose.model<IRoadmapDocument>("Roadmap", RoadmapSchema);

export default Roadmap;
