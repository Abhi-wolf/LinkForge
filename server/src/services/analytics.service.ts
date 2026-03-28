import { serverConfig } from "../config";
import type { CreateRawAnalyticsDto } from "../dtos/analytics.dto";
import type { IHourlyAggregatedAnalyticsModel } from "../models/analytics.model";
import { UrlStatus } from "../models/url.model";
import { AnalyticsRepository } from "../repositories/analytics.repository";
import { UrlRepository } from "../repositories/url.repository";
import { NotFoundError } from "../utils/errors/app.error";
import { getUTCRange } from "../utils/getUTCRange";

export class AnalyticsService {
  constructor(
    private readonly analyticsRepository: AnalyticsRepository,
    private readonly urlRepository: UrlRepository,
  ) { }

  /**
   * Create raw analytics entry
   * @param data - Raw analytics data
   * @returns Promise<IHourlyAggregatedAnalyticsModel> - Created analytics entry
   * @throws NotFoundError - If URL not found
   */
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

  /**
   * Aggregate analytics for a date range
   * @param start - Start date
   * @param end - End date
   */
  async aggregateAnalytics(start: Date, end: Date) {
    await this.analyticsRepository.aggregateAnalytics(start, end);
  }

  /**
   * Get aggregated analytics for a date range
   * @param urlId - URL ID
   * @param startDate - Start date
   * @param endDate - End date
   * @param timezone - Timezone
   * @returns Promise<IHourlyAggregatedAnalyticsModel[]> - Array of analytics entries
   */
  async getAggregatedAnalyticsForDate(
    urlId: string,
    startDate: string,
    endDate: string,
    timezone: string,
  ) {
    const utcStartDates = getUTCRange(startDate, timezone);
    const utcEndDates = getUTCRange(endDate, timezone);

    const analytics =
      await this.analyticsRepository.getAggregatedAnalyticsForDate(
        urlId,
        utcStartDates.utcStart,
        utcEndDates.utcEnd,
      );

    return analytics;
  }

  /**
   * Get user analytics
   * @param userId - User ID
   * @returns Promise<any> - User analytics
   * @todo Remove N+1 query problem
   */
  // TODO : remove N+1 query
  async getUserAnalytics(userId: string) {
    const baseUrl = serverConfig.BASE_URL;

    const userUrls = await this.urlRepository.getUrlsOfUser(userId);
    const activeLinksCount = userUrls.filter(
      (url) => url.status === UrlStatus.ACTIVE,
    )?.length;

    const inactiveLinks = userUrls
      .filter((url) => url.status === UrlStatus.INACTIVE)
      .map((link) => ({
        id: link.id,
        shortUrl: link.shortUrl,
        originalUrl: link.originalUrl,
        fullUrl: `${baseUrl}/fwd/${link.shortUrl}`,
        createdAt: link.createdAt,
        status: link.status,
      }));

    const expiredLinks = userUrls
      .filter((url) => url.status === UrlStatus.EXPIRED)
      .map((link) => ({
        id: link.id,
        shortUrl: link.shortUrl,
        originalUrl: link.originalUrl,
        fullUrl: `${baseUrl}/fwd/${link.shortUrl}`,
        createdAt: link.createdAt,
        status: link.status,
      }));

    // recent links created in the last 7 days
    const sortedLinks = userUrls.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const recentLinks = sortedLinks?.slice(0, 5)?.map((link) => ({
      id: link.id,
      shortUrl: link.shortUrl,
      originalUrl: link.originalUrl,
      fullUrl: `${baseUrl}/fwd/${link.shortUrl}`,
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
        fullUrl: `${baseUrl}/fwd/${url.shortUrl}`,
        originalUrl: url.originalUrl,
        status: url.status,
      });
    }

    topPerformingLinks.sort((a, b) => b.clicks - a.clicks);
    topPerformingLinks.splice(5);

    return {
      totalLinks,
      activeLinks: activeLinksCount,
      totalClicks,
      recentLinks,
      inactiveLinks,
      expiredLinks,
      topPerformingLinks,
    };
  }

  /**
   * Get analytics for a URL ID
   * @param urlId - URL ID
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Promise<any> - Analytics data
   */
  async getAnalyticsForUrlId(urlId: string, startDate: Date, endDate: Date) {
    // frontend will send date in ISO formate with ISO in it - when we use new Date
    // it will automatically get converted to UTC dates
    const utcStartDate = new Date(startDate);
    const utcEndDate = new Date(endDate);

    const urlInfo = await this.urlRepository.findById(urlId);

    if (!urlInfo) {
      throw new NotFoundError("URL not found for analytics");
    }

    const rawDocs =
      await this.analyticsRepository.findHourlyAggregatedAnalyticsByUrlId(
        urlId,
        utcStartDate,
        utcEndDate,
      );

    // Object.entries does not work on Mongoose maps
    const mergeMaps = (field: keyof IHourlyAggregatedAnalyticsModel) => {
      const result: Record<string, number> = {};
      rawDocs.forEach((doc) => {
        const mapField = doc[field] as Map<string, number>;
        mapField.forEach((value, key) => {
          result[key] = (result[key] || 0) + value;
        });
      });
      return result;
    };

    const sortMap = (map: Record<string, number>) =>
      Object.entries(map)
        .sort((a, b) => b[1] - a[1])
        .map(([key, value]) => ({ key, value }));

    // ✅ Group clicks by day
    const clicksPerDay = rawDocs.reduce(
      (acc, doc) => {
        const day = doc.utcStartDate.toISOString().split("T")[0]; // "2024-03-19"
        acc[day] = (acc[day] || 0) + doc.clicks;
        return acc;
      },
      {} as Record<string, number>,
    );

    // ✅ Fill missing dates with 0 clicks
    const clicksPerDayFilled: { date: string; clicks: number }[] = [];
    const current = new Date(startDate);
    const end = new Date(endDate);

    // Ensure we include the last day by normalizing time to midnight
    current.setUTCHours(0, 0, 0, 0);
    end.setUTCHours(0, 0, 0, 0);

    while (current <= end) {
      const dateStr = current.toISOString().split("T")[0];
      clicksPerDayFilled.push({
        date: dateStr,
        clicks: clicksPerDay[dateStr] || 0,
      });
      current.setUTCDate(current.getUTCDate() + 1);
    }

    const clicksPerDaySorted = clicksPerDayFilled; // Already sorted by nature of the loop

    const os = mergeMaps("os");
    const browser = mergeMaps("browser");
    const device = mergeMaps("device");
    const country = mergeMaps("country");
    const region = mergeMaps("region");
    const city = mergeMaps("city");
    const timezone = mergeMaps("timezone");
    const utmSource = mergeMaps("utmSource");
    const ref = mergeMaps("ref");

    const analyticsNumbers = {
      clicks: rawDocs.reduce((sum, doc) => sum + doc.clicks, 0),
      clicksPerDay: clicksPerDaySorted, // ✅ [{date: "2024-03-01", clicks: 42}, ...]
      os: sortMap(os),
      browser: sortMap(browser),
      device: sortMap(device),
      country: sortMap(country),
      region: sortMap(region),
      city: sortMap(city),
      timezone: sortMap(timezone),
      utmSource: sortMap(utmSource),
      ref: sortMap(ref),


    };

    const urlDesc = {
      id: urlInfo.id,
      shortUrl: urlInfo.shortUrl,
      originalUrl: urlInfo.originalUrl,
      fullUrl: `${serverConfig.BASE_URL}/${urlInfo.shortUrl}`,
      createdAt: urlInfo.createdAt,
      status: urlInfo.status,
      expiresAt: urlInfo.expirationDate,
    }

    return { urlId, analyticsNumbers, urlDesc, startDate, endDate };
  }
}
