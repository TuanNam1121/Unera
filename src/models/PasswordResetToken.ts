import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IPasswordResetToken extends Document {
  userId: Types.ObjectId;
  email: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

const PasswordResetTokenSchema = new Schema<IPasswordResetToken>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } }, // MongoDB TTL Index tự động dọn dẹp khi hết hạn
  },
  {
    timestamps: true,
  }
);

export const PasswordResetToken: Model<IPasswordResetToken> =
  mongoose.models.PasswordResetToken ||
  mongoose.model<IPasswordResetToken>("PasswordResetToken", PasswordResetTokenSchema);

export default PasswordResetToken;

