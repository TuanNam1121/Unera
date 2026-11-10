import mongoose, { Schema, Document, Model } from "mongoose";
import { IRoadmap } from "@/types";

export interface IRoadmapDocument extends Omit<IRoadmap, "_id">, Document {}

const RoadmapTaskSchema = new Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    completed: { type: Boolean, default: false },
    dueDate: { type: Date },
  },
  { _id: false }
);

const RoadmapMilestoneSchema = new Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    tasks: { type: [RoadmapTaskSchema], default: [] },
  },
  { _id: false }
);

const RoadmapSemesterSchema = new Schema(
  {
    semesterNumber: { type: Number, required: true },
    milestones: { type: [RoadmapMilestoneSchema], default: [] },
  },
  { _id: false }
);

const RoadmapYearSchema = new Schema(
  {
    yearNumber: { type: Number, required: true },
    semesters: { type: [RoadmapSemesterSchema], default: [] },
  },
  { _id: false }
);

const RoadmapSchema = new Schema<IRoadmapDocument>(
  {
    studentId: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ["ACTIVE", "ARCHIVED"],
      default: "ACTIVE",
      required: true,
      index: true,
    },
    templateId: { type: Schema.Types.ObjectId, ref: "RoadmapTemplate" },
    goalSnapshot: { type: Schema.Types.Mixed, default: {} },
    progressPercent: { type: Number, default: 0, min: 0, max: 100 },
    years: { type: [RoadmapYearSchema], default: [] },
  },
  {
    timestamps: true,
  }
);

// Tự động tính phần trăm hoàn thành trước khi lưu
RoadmapSchema.pre("save", function () {
  let totalTasks = 0;
  let completedTasks = 0;

  for (const year of this.years) {
    for (const semester of year.semesters) {
      for (const milestone of semester.milestones) {
        for (const task of milestone.tasks) {
          totalTasks++;
          if (task.completed) {
            completedTasks++;
          }
        }
      }
    }
  }

  this.progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
});

export const Roadmap: Model<IRoadmapDocument> =
  mongoose.models.Roadmap || mongoose.model<IRoadmapDocument>("Roadmap", RoadmapSchema);

export default Roadmap;
