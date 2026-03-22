export enum ApiKeyStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  REVOKED = "revoked",
}

export interface ApiKey {
  id: string;
  apiKey: string;
  description?: string;
  apiKeyStatus: ApiKeyStatus;
  createdAt: string;
  updatedAt: string;
  userId?: {
    _id: string;
    name: string;
    email: string;
  };
}