import { serverConfig } from "../config";
import { ApiKeyRepository } from "../repositories/apiKey.repository";
import crypto from "crypto";
import { BadRequestError, NotFoundError } from "../utils/errors/app.error";

export class ApiKeyService {
  constructor(private readonly apiKeyRepository: ApiKeyRepository) { }

  async createApiKey(userId: string, description?: string) {
    const rawApiKey = this.generateApiKey(userId);
    const hashedKey = this.hashKey(rawApiKey);

    const savedKey = await this.apiKeyRepository.create({
      userId,
      apiKey: hashedKey,
      description,
    });

    return {
      ...savedKey.toObject(),
      apiKey: rawApiKey,
    };
  }

  async verifyApiKey(rawKey: string) {
    const hashedKey = this.hashKey(rawKey);
    return await this.apiKeyRepository.findApiKey(hashedKey);
  }

  async updateApiKeyStatus(id: string, status: string, userId: string) {
    // Find the API key and verify ownership
    const apiKey = await this.apiKeyRepository.findApiKeyById(id);
    if (!apiKey) {
      throw new NotFoundError("API key not found");
    }

    // Since findApiKeyById populates userId, we need to check _id if it's an object
    const apiUserId =
      typeof apiKey.userId === "object" && "_id" in apiKey.userId!
        ? (apiKey.userId as any)._id.toString()
        : apiKey.userId.toString();

    if (apiUserId !== userId) {
      throw new BadRequestError("Access denied");
    }

    return await this.apiKeyRepository.updateApiKeyStatus(id, status);
  }

  async deleteApiKey(id: string, userId: string) {
    // Find the API key and verify ownership
    const apiKey = await this.apiKeyRepository.findApiKeyById(id);
    if (!apiKey) {
      throw new NotFoundError("API key not found");
    }

    const apiUserId =
      typeof apiKey.userId === "object" && "_id" in apiKey.userId!
        ? (apiKey.userId as any)._id.toString()
        : apiKey.userId.toString();

    if (apiUserId !== userId) {
      throw new BadRequestError("Access denied");
    }

    return await this.apiKeyRepository.deleteApiKey(id);
  }

  private hashKey(rawKey: string) {
    return crypto.createHash("sha256").update(rawKey).digest("hex");
  }

  private generateApiKey(
    userId: string,
    prefix = serverConfig.NODE_ENV === "production"
      ? "apiKey_prod"
      : "apiKey_dev",
  ): string {
    const userEntropy = `${userId}`;
    const randomPart = crypto.randomBytes(24).toString("hex");
    const combined = `${userEntropy}-${randomPart}`;

    // Hash the combined string for consistent length
    const key = crypto.createHash("sha256").update(combined).digest("hex");

    return `${prefix}_${key}`;
  }
}
