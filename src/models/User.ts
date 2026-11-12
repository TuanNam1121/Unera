import mongoose, { Schema, Document, Model } from "mongoose";
import { USER_ROLES, ACCOUNT_STATUS, AUTH_PROVIDERS, ONBOARDING_STEPS } from "@/constants";
import { IUser } from "@/types";

export interface IUserDocument extends Omit<IUser, "_id">, Document {}

const UserSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String }, // Optional khi đăng nhập qua Google OAuth
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.STUDENT,
      required: true,
    },
    avatar: { type: String },
    status: {
      type: String,
      enum: Object.values(ACCOUNT_STATUS),
      default: ACCOUNT_STATUS.ACTIVE,
      required: true,
    },
    authProviders: {
      type: [String],
      enum: Object.values(AUTH_PROVIDERS),
      default: [AUTH_PROVIDERS.CREDENTIALS],
    },
    googleId: { type: String, unique: true, sparse: true },
    isProfileCompleted: { type: Boolean, default: false },
    onboardingStep: {
      type: String,
      enum: Object.values(ONBOARDING_STEPS),
      default: ONBOARDING_STEPS.PROFILE,
    },
    lastLoginAt: { type: Date, default: null },
    emailVerified: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

export const User: Model<IUserDocument> =
  mongoose.models.User || mongoose.model<IUserDocument>("User", UserSchema);

export default User;

