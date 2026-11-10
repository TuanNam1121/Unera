import mongoose, { Schema, Document, Model } from "mongoose";
import { IStudentProfile } from "@/types";

export interface IStudentProfileDocument extends Omit<IStudentProfile, "_id">, Document {}

const DevelopmentGoalsSchema = new Schema(
  {
    studyAbroad: { type: Boolean, default: false },
    employment: { type: Boolean, default: false },
    scientificResearch: { type: Boolean, default: false },
    startup: { type: Boolean, default: false },
    personalGrowth: { type: Boolean, default: false },
    notes: { type: String, trim: true },
  },
  { _id: false }
);

const StudentProfileSchema = new Schema<IStudentProfileDocument>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    fullName: { type: String, required: true, trim: true },
    avatar: { type: String },
    university: { type: String, trim: true },
    major: { type: String, trim: true },
    academicYear: { type: String, trim: true },
    bio: { type: String, trim: true },
    developmentGoals: {
      type: DevelopmentGoalsSchema,
      default: () => ({}),
    },
    skills: { type: [String], default: [] },
    achievements: { type: [String], default: [] },
  },
  {
    timestamps: true,
  }
);

export const StudentProfile: Model<IStudentProfileDocument> =
  mongoose.models.StudentProfile ||
  mongoose.model<IStudentProfileDocument>("StudentProfile", StudentProfileSchema);

export default StudentProfile;
