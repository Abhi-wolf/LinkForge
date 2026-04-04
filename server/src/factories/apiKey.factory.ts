import { ApiKeyRepository } from "../repositories/apiKey.repository";
import { CacheRepository } from "../repositories/cache.repository";
import { ApiKeyService } from "../services/apiKey.service";

export class ApiKeyFactory {
  private static apiKeyRepository: ApiKeyRepository;
  private static apiKeyService: ApiKeyService;

  private static cacheRepository: CacheRepository;

  static getCacheRepository(): CacheRepository {
    if (!this.cacheRepository) {
      this.cacheRepository = new CacheRepository();
    }
    return this.cacheRepository;
  }

  static getApiKeyRepository(): ApiKeyRepository {
    if (!this.apiKeyRepository) {
      this.apiKeyRepository = new ApiKeyRepository();
    }
    return this.apiKeyRepository;
  }

  static getApiKeyService(): ApiKeyService {
    if (!this.apiKeyService) {
      this.apiKeyService = new ApiKeyService(this.getApiKeyRepository(),this.getCacheRepository());
    }
    return this.apiKeyService;
  }
}
