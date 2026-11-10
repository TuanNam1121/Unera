import mongoose, { Schema, Document, Model } from "mongoose";
import { IMentorProfile } from "@/types";

export interface IMentorProfileDocument extends Omit<IMentorProfile, "_id">, Document {}

const MentorProfileSchema = new Schema<IMentorProfileDocument>(
  {
    name: { type: String, required: true, trim: true, index: "text" },
    avatar: { type: String },
    position: { type: String, required: true, trim: true },
    organization: { type: String, required: true, trim: true },
    expertise: { type: [String], default: [], index: true },
    experience: { type: String, trim: true },
    bio: { type: String, trim: true },
    topics: { type: [String], default: [] },
    isActive: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
  }
);

export const MentorProfile: Model<IMentorProfileDocument> =
  mongoose.models.MentorProfile ||
  mongoose.model<IMentorProfileDocument>("MentorProfile", MentorProfileSchema);

export default MentorProfile;

