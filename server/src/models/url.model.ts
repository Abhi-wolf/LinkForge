import mongoose, { Document } from "mongoose";

export interface IUrl extends Document {
  originalUrl: string;
  shortUrl: string;
  createdAt: Date;
  updatedAt: Date;
  clicks: number;
  tags: string[];
  expirationDate: Date | null;
  status: UrlStatus;
  userId: mongoose.Types.ObjectId | null;
}

export enum UrlStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  DELETED = "deleted",
  EXPIRED = "expired",
  BLOCKED = "blocked",
}

const urlSchema = new mongoose.Schema(
  {
    originalUrl: {
      type: String,
      required: true,
    },
    shortUrl: {
      type: String,
      required: true,
      unique: true,
    },
    clicks: {
      type: Number,
      default: 0,
    },
    tags: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: Object.values(UrlStatus),
      default: UrlStatus.ACTIVE,
    },
    expirationDate: {
      type: Date,
      default: null,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

// unique property will automatically create index
// urlSchema.index({ shortUrl: 1 }, { unique: true });

const Url = mongoose.model<IUrl>("Url", urlSchema);

export default Url;
