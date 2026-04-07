import { serverConfig } from "../config";
import type { CreateRawAnalyticsDto } from "../dtos/analytics.dto";
import type { IHourlyAggregatedAnalyticsModel } from "../models/analytics.model";
import { UrlStatus } from "../models/url.model";
import { AnalyticsRepository } from "../repositories/analytics.repository";
import { UrlRepository } from "../repositories/url.repository";
import { NotFoundError } from "../utils/errors/app.error";
import { getUTCRange } from "../utils/getUTCRange";
import { createContextLogger } from "../config/logger.config";

const analyticsLogger = createContextLogger("analytics", "service");

export class AnalyticsService {
  constructor(
    private readonly analyticsRepository: AnalyticsRepository,
    private readonly urlRepository: UrlRepository,
  ) {}

  /**
   * Create raw analytics entry
   * @param data - Raw analytics data
   * @returns Promise<IHourlyAggregatedAnalyticsModel> - Created analytics entry
   * @throws NotFoundError - If URL not found
   */
  async createRawAnalytics(data: CreateRawAnalyticsDto) {
    analyticsLogger.info("createRawAnalytics", "Recording raw analytics", {
      shortUrl: data.shortUrl,
    });
    const url = await this.urlRepository.findByShortUrl(data.shortUrl);

    if (!url) {
      analyticsLogger.warn(
        "createRawAnalytics",
        "URL not found for analytics",
        { shortUrl: data.shortUrl },
      );
      throw new NotFoundError("URL not found for analytics");
    }

    analyticsLogger.info(
      "createRawAnalytics",
      "Creating raw analytics record in DB",
      { urlId: url._id?.toString() },
    );
    const rawAnalytics = await this.analyticsRepository.createRawAnalytics({
      ...data,
      urlId: url._id?.toString(),
      utcDate: new Date(data.utcDate),
    });

    analyticsLogger.info(
      "createRawAnalytics",
      "Raw analytics recorded successfully",
      {
        shortUrl: data.shortUrl,
        urlId: url._id?.toString(),
      },
    );

    return rawAnalytics;
  }

  /**
   * Aggregate analytics for a date range
   * @param start - Start date
   * @param end - End date
   */
  async aggregateAnalytics(start: Date, end: Date) {
    analyticsLogger.info("aggregateAnalytics", "Starting aggregation", {
      start,
      end,
    });
    await this.analyticsRepository.aggregateAnalytics(start, end);
    analyticsLogger.info("aggregateAnalytics", "Aggregation completed");
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
    analyticsLogger.info(
      "getAggregatedAnalyticsForDate",
      "Fetching aggregated analytics",
      { urlId, startDate, endDate, timezone },
    );
    const utcStartDates = getUTCRange(startDate, timezone);
    const utcEndDates = getUTCRange(endDate, timezone);

    const analytics =
      await this.analyticsRepository.getAggregatedAnalyticsForDate(
        urlId,
        utcStartDates.utcStart,
        utcEndDates.utcEnd,
      );

    analyticsLogger.info(
      "getAggregatedAnalyticsForDate",
      "Aggregated analytics fetched",
      { urlId, count: analytics.length },
    );
    return analytics;
  }

  /**
   * Get user dashboard analytics
   * @param userId - User ID
   * @returns Promise<any> - User analytics
   */
  async getUserDashboardAnalytics(userId: string) {
    const baseUrl=serverConfig.BASE_URL;

    analyticsLogger.info(
      "getUserDashboardAnalytics",
      "Fetching user dashboard analytics",
      { userId },
    );

    let userUrls =
      await this.analyticsRepository.getUserDashboardAnalytics(userId);

    userUrls = userUrls?.map((url) => ({
      ...url,
      fullUrl: `${baseUrl}/fwd/${url.shortUrl}`,
    }));

    analyticsLogger.info(
      "getUserDashboardAnalytics",
      "User dashboard analytics fetched",
      { userId, count: userUrls.length },
    );

    const totalLinks = userUrls.length;
    const activeLinks = userUrls.filter(
      (url) => url.status === UrlStatus.ACTIVE,
    ).length;
    const totalClicks = userUrls.reduce((acc, url) => acc + url.totalClicks, 0);

    const recentLinks = userUrls.slice(0, 5);

    const inactiveLinks = userUrls.filter(
      (url) => url.status === UrlStatus.INACTIVE,
    );

    let expiredLinks = userUrls.filter(
      (url) => url.status === UrlStatus.EXPIRED,
    );

    expiredLinks =
      expiredLinks
        .sort(
          (a, b) =>
            new Date(b.expiresAt).getTime() - new Date(a.expiresAt).getTime(),
        )
        ?.slice(0, 5) || [];

    const topPerformingLinks = [...userUrls]
      .sort((a, b) => b.totalClicks - a.totalClicks)
      .slice(0, 5);

    analyticsLogger.info(
      "getUserDashboardAnalytics",
      "User dashboard analytics compiled",
      { userId },
    );

    return {
      totalLinks,
      activeLinks,
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
  async getAnalyticsForUrlId(
    userId: string,
    urlId: string,
    startDate: Date,
    endDate: Date,
  ) {
    analyticsLogger.info(
      "getAnalyticsForUrlId",
      "Fetching detailed analytics for URL",
      { urlId, startDate, endDate },
    );
    // frontend will send date in ISO formate with ISO in it - when we use new Date
    // it will automatically get converted to UTC dates
    const utcStartDate = new Date(startDate);
    const utcEndDate = new Date(endDate);

    analyticsLogger.info("getAnalyticsForUrlId", "Finding URL info", { urlId });
    const urlInfo = await this.urlRepository.findById(urlId);

    if (!urlInfo || (urlInfo.userId && urlInfo.userId?.toString() !== userId)) {
      analyticsLogger.warn(
        "getAnalyticsForUrlId",
        "URL not found for analytics",
        { urlId },
      );
      throw new NotFoundError("URL not found for analytics");
    }

    analyticsLogger.info("getAnalyticsForUrlId", "Fetching raw hourly docs", {
      urlId,
    });
    const rawDocs =
      await this.analyticsRepository.findHourlyAggregatedAnalyticsByUrlId(
        urlId,
        utcStartDate,
        utcEndDate,
      );

    analyticsLogger.info(
      "getAnalyticsForUrlId",
      "Merging maps for OS, browser, etc.",
      { urlId, docsCount: rawDocs.length },
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
      fullUrl: `${serverConfig.BASE_URL}/fwd/${urlInfo.shortUrl}`,
      createdAt: urlInfo.createdAt,
      status: urlInfo.status,
      expiresAt: urlInfo.expirationDate,
    };

    analyticsLogger.info(
      "getAnalyticsForUrlId",
      "URL analytics compiled successfully",
      { urlId },
    );
    return { urlId, analyticsNumbers, urlDesc, startDate, endDate };
  }
}
