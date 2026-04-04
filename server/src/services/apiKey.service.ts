import { serverConfig } from "../config";
import { ApiKeyRepository } from "../repositories/apiKey.repository";
import crypto from "crypto";
import {
  ForbiddenError,
  NotFoundError,
} from "../utils/errors/app.error";
import { CacheRepository } from "../repositories/cache.repository";

export class ApiKeyService {
  constructor(private readonly apiKeyRepository: ApiKeyRepository,
    private readonly cacheRepository: CacheRepository
  ) { }

  /**
   * Create a new API key
   * @param userId - User ID
   * @param description - Description of the API key
   * @returns Promise<any> - Created API key
   */
  async createApiKey(userId: string, description?: string) {
    const rawApiKey = this.generateApiKey();
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

  /**
   * Verify an API key
   * @param rawKey - Raw API key
   * @returns Promise<any> - Verified API key
   */
  async verifyApiKey(rawKey: string) {
    const hashedKey = this.hashKey(rawKey);

    const cachedApiKeyData = await this.cacheRepository.getCachedApiKey(hashedKey);
    if (cachedApiKeyData) {
      return cachedApiKeyData;
    }

    const apiKey = await this.apiKeyRepository.findApiKey(hashedKey);

    if (apiKey) {
      await this.cacheRepository.setApiKeyCache(hashedKey, apiKey.userId.toString());
    }

    return apiKey;
  }

  /**
   * Get API keys for a user
   * @param userId - User ID
   * @returns Promise<any[]> - Array of API keys
   */
  async getUserApiKeys(userId:string) {
    const apiKeys = await this.apiKeyRepository.findApiKeysOfUser(userId);
    return apiKeys;
  }

  /**
   * Update API key status
   * @param id - API key ID
   * @param status - New status
   * @param userId - User ID
   * @returns Promise<any> - Updated API key
   */
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
      throw new ForbiddenError("Access denied");
    }
    
    await this.cacheRepository.deleteCachedApiKey(apiKey.apiKey);

    return await this.apiKeyRepository.updateApiKeyStatus(id, status);
  }

  /**
   * Delete an API key
   * @param id - API key ID
   * @param userId - User ID
   * @returns Promise<any> - Deleted API key
   */
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
      throw new ForbiddenError("Access denied");
    }

    await this.cacheRepository.deleteCachedApiKey(apiKey.apiKey);
    
    return await this.apiKeyRepository.deleteApiKey(id);
  }

  /**
   * Hash an API key
   * @param rawKey - Raw API key
   * @returns string - Hashed API key
   */
  private hashKey(rawKey: string) {
    return crypto.createHash("sha256").update(rawKey).digest("hex");
  }

  /**
   * Generate a new API key
   * @param prefix - Prefix for the API key
   * @returns string - Generated API key
   */
  private generateApiKey(
    prefix = serverConfig.NODE_ENV === "production"
      ? "apiKey_prod"
      : "apiKey_dev",
  ): string {
    const randomPart = crypto.randomBytes(32).toString("hex");
    return `${prefix}_${randomPart}`;
  }
}
