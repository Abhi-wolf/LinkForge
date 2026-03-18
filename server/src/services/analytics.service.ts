import { serverConfig } from "../config";
import { CreateRawAnalyticsDto } from "../dtos/analytics.dto";
import { UrlStatus } from "../models/url.model";
import { AnalyticsRepository } from "../repositories/analytics.repository";
import { UrlRepository } from "../repositories/url.repository";
import { NotFoundError } from "../utils/errors/app.error";
import { getUTCRange } from "../utils/getUTCRange";

export class AnalyticsService {
  constructor(
    private readonly analyticsRepository: AnalyticsRepository,
    private readonly urlRepository: UrlRepository,
  ) {}

  async createRawAnalytics(data: CreateRawAnalyticsDto) {
    const url = await this.urlRepository.findByShortUrl(data.shortUrl);

    if (!url) {
      throw new NotFoundError("URL not found for analytics");
    }

    const rawAnalytics = await this.analyticsRepository.createRawAnalytics({
      ...data,
      urlId: url._id?.toString(),
      utcDate: new Date(data.utcDate),
    });
    return rawAnalytics;
  }

  async getHourlyAggregatedAnalyticsByUrlId(urlId: string) {
    const analytics =
      await this.analyticsRepository.findHourlyAggregatedAnalyticsByUrlId(
        urlId,
      );
    return analytics;
  }

  async aggregateAnalytics(start: Date, end: Date) {
    await this.analyticsRepository.aggregateAnalytics(start, end);
  }

  async getAggregatedAnalyticsForDate(
    urlId: string,
    startDate: string,
    endDate: string,
    timezone: string,
  ) {
    const utcStartDates = getUTCRange(startDate, timezone);
    const utcEndDates = getUTCRange(endDate, timezone);

    console.log(
      "UTC START : ",
      utcStartDates.utcStart,
      " UTC END : ",
      utcEndDates.utcEnd,
    );

    const analytics =
      await this.analyticsRepository.getAggregatedAnalyticsForDate(
        urlId,
        utcStartDates.utcStart,
        utcEndDates.utcEnd,
      );

    return analytics;
  }

  async getUserAnalytics(userId: string) {
    const baseUrl = serverConfig.BASE_URL;
    // const userId = "69b6e3b7329d6f7cf8bd16b4"; // todo: get user id from auth context

    const userUrls = await this.urlRepository.getUrlsOfUser(userId);
    const activeLinks = userUrls.filter(
      (url) => url.status === UrlStatus.ACTIVE,
    )?.length;

    // recent links created in the last 7 days
    const sortedLinks = userUrls.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const recentLinks = sortedLinks?.slice(0, 5)?.map((link) => ({
      id: link.id,
      shortUrl: link.shortUrl,
      originalUrl: link.originalUrl,
      fullUrl: `${baseUrl}/${link.shortUrl}`,
      createdAt: link.createdAt,
      status: link.status,
    }));

    const totalLinks = userUrls.length;
    let totalClicks = 0;
    const topPerformingLinks = [];

    for (let url of userUrls) {
      const urlClicks = await this.analyticsRepository.getTotalClicksForUrl(
        url.id,
      );

      totalClicks += urlClicks;

      topPerformingLinks.push({
        id: url.id,
        shortUrl: url.shortUrl,
        clicks: urlClicks,
        fullUrl: `${baseUrl}/${url.shortUrl}`,
        originalUrl: url.originalUrl,
      });
    }

    topPerformingLinks.sort((a, b) => b.clicks - a.clicks);
    topPerformingLinks.splice(5);

    return {
      totalLinks,
      activeLinks,
      totalClicks,
      topPerformingLinks,
      recentLinks,
    };
  }
}
