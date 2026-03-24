import { AnalyticsRepository } from "../repositories/analytics.repository";
import { UrlRepository } from "../repositories/url.repository";
import { AnalyticsService } from "../services/analytics.service";

export class AnalyticsFactory {
  private static urlRepository: UrlRepository;
  private static analyticsService: AnalyticsService;
  private static analyticsRepository: AnalyticsRepository;

  static getUrlRepository(): UrlRepository {
    if (!this.urlRepository) {
      this.urlRepository = new UrlRepository();
    }
    return this.urlRepository;
  }

 

  static getAnalyticsRepository(): AnalyticsRepository {
    if (!this.analyticsRepository) {
      this.analyticsRepository = new AnalyticsRepository();
    }
    return this.analyticsRepository;
  }

  static getAnalyticsService(): AnalyticsService {
    if (!this.analyticsRepository) {
      this.analyticsService = new AnalyticsService(
        this.getAnalyticsRepository(),
        this.getUrlRepository(),
      );
    }
    return this.analyticsService;
  }
}
