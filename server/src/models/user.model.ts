import mongoose, { Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  tokenVersion: number;
  createdAt: Date;
  updatedAt: Date;
  roles: UserRole;
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
  },
  {
    timestamps: true,
  },
);


const User = mongoose.model<IUser>("User", userSchema);

export default User;
