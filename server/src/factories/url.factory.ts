import { AnalyticsRepository } from "../repositories/analytics.repository";
import { CacheRepository } from "../repositories/cache.repository";
import { CounterRepository } from "../repositories/counter.repository";
import { UrlRepository } from "../repositories/url.repository";
import { UrlService } from "../services/url.service";

export class UrlFactory {
  private static urlRepository: UrlRepository;
  private static urlService: UrlService;
  private static cacheRepository: CacheRepository;
  private static analyticsRepository: AnalyticsRepository;
  private static counterRepository: CounterRepository;

  static getUrlRepository(): UrlRepository {
    if (!this.urlRepository) {
      this.urlRepository = new UrlRepository();
    }
    return this.urlRepository;
  }

  static getCacheRepository(): CacheRepository {
    if (!this.cacheRepository) {
      this.cacheRepository = new CacheRepository();
    }
    return this.cacheRepository;
  }

  static getAnalyticsRepository(): AnalyticsRepository {
    if (!this.analyticsRepository) {
      this.analyticsRepository = new AnalyticsRepository();
    }
    return this.analyticsRepository;
  }

  static getCounterRepository(): CounterRepository {
    if (!this.counterRepository) {
      this.counterRepository = new CounterRepository();
    }
    return this.counterRepository;
  }

  static getUrlService(): UrlService {
    if (!this.urlService) {
      this.urlService = new UrlService(
        this.getUrlRepository(),
        this.getCacheRepository(),
        this.getAnalyticsRepository(),
        this.getCounterRepository(),
      );
    }
    return this.urlService;
  }
}
