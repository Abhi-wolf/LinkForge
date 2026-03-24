import { ApiKeyRepository } from "../repositories/apiKey.repository";
import { ApiKeyService } from "../services/apiKey.service";

export class ApiKeyFactory {
  private static apiKeyRepository: ApiKeyRepository;
  private static apiKeyService: ApiKeyService;

  static getApiKeyRepository(): ApiKeyRepository {
    if (!this.apiKeyRepository) {
      this.apiKeyRepository = new ApiKeyRepository();
    }
    return this.apiKeyRepository;
  }

  static getApiKeyService(): ApiKeyService {
    if (!this.apiKeyService) {
      this.apiKeyService = new ApiKeyService(this.getApiKeyRepository());
    }
    return this.apiKeyService;
  }
}
