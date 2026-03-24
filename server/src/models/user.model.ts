import mongoose, { Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  tokenVersion: number;
  createdAt: Date;
  updatedAt: Date;
  roles: UserRole;
  emailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
}

export enum UserRole {
  USER = "user",
  ADMIN = "admin",
}

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    tokenVersion: {
      type: Number,
      default: 0,
    },
    roles: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
  },
);


const User = mongoose.model<IUser>("User", userSchema);

export default User;
