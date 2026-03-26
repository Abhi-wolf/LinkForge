import mongoose, { Document } from "mongoose";


export enum ApiKeyStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    REVOKED = "revoked",
}


export interface IApiKey extends Document {
  userId: mongoose.Types.ObjectId | string;
  apiKey: string;
  description?: string;
  apiKeyStatus: ApiKeyStatus;
  createdAt: Date;
  updatedAt: Date;
}


const apiKeySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    
    apiKey: {
      type: String,
      required:true,
    },

    description: {
      type: String,
      required: false,
    },
    
    apiKeyStatus: {
      type: String,
      enum: Object.values(ApiKeyStatus),
      default: ApiKeyStatus.ACTIVE,
    },
  },
  {
    timestamps: true,
  },
);

apiKeySchema.index({ userId: 1 });        // one user → many keys
apiKeySchema.index({ apiKey: 1 }, { unique: true }); // each key is unique

const ApiKey = mongoose.model<IApiKey>("ApiKey", apiKeySchema);

export default ApiKey;
