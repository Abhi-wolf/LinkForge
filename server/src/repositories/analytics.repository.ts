import mongoose from "mongoose";
import {
  HourlyAggregatedAnalytics,
  RawAnalytics,
} from "../models/analytics.model";
import logger from "../config/logger.config";
import { CreateRawAnalyticsDto } from "../dtos/analytics.dto";
import Url, { UrlStatus } from "../models/url.model";

export interface CreateRawAnalytics {
  urlId: string;
  os: string;
  browser: string;
  device: string;
  country: string;
  region: string;
  city: string;
  timezone: string;
  utcDate: Date;
  utmSource?: string;
  ref?: string;
}

function increment(map: Map<string, number>, key: string) {
  map.set(key, (map.get(key) || 0) + 1);
}

function mapToObject(map: Map<string, number>) {
  return Object.fromEntries(map);
}

export class AnalyticsRepository {
  async createRawAnalytics(data: CreateRawAnalytics) {
    const rawAnalytics = await RawAnalytics.create(data);
    return rawAnalytics;
  }

  async findHourlyAggregatedAnalyticsByUrlId(
    urlId: string,
    startDate: Date,
    endDate: Date,
  ) {
    // const analytics = await HourlyAggregatedAnalytics.find({ urlId });
    const rawDocs = await HourlyAggregatedAnalytics.find({
      urlId,
      utcStartDate: { $gte: startDate },
      utcEndDate: { $lte: endDate },
    });
    return rawDocs;
  }

  async deleteAnalyticsByUrlId(urlId: string) {
    await RawAnalytics.deleteMany({ urlId });
    await HourlyAggregatedAnalytics.deleteMany({ urlId });
    return;
  }

  async aggregateAnalytics(start: Date, end: Date) {
    const rawAnalytics = await RawAnalytics.find({
      utcDate: {
        $gte: start,
        $lt: end,
      },
    });

    logger.info("Hourly aggregation started", {
      rawCount: rawAnalytics.length,
      utcWindowStart: start.toISOString(),
      utcWindowEnd: end.toISOString(),
    });

    const aggregationMap: Map<
      string,
      {
        clicks: number;
        os: Map<string, number>;
        browser: Map<string, number>;
        device: Map<string, number>;
        country: Map<string, number>;
        region: Map<string, number>;
        city: Map<string, number>;
        timezone: Map<string, number>;
        utcStartDate: Date;
        utcEndDate: Date;
        utmSource: Map<string, number>;
        ref: Map<string, number>;
      }
    > = new Map();

    for (const analytics of rawAnalytics) {
      const urlId = analytics.urlId.toString();

      if (!aggregationMap.has(urlId)) {
        aggregationMap.set(urlId, {
          clicks: 0,
          os: new Map(),
          browser: new Map(),
          device: new Map(),
          country: new Map(),
          region: new Map(),
          city: new Map(),
          timezone: new Map(),
          utcStartDate: start,
          utcEndDate: end,
          utmSource: new Map(),
          ref: new Map(),
        });
      }

      const urlAggregation = aggregationMap.get(urlId)!;
      urlAggregation.clicks += 1;
      increment(urlAggregation.os, analytics.os);
      increment(urlAggregation.browser, analytics.browser);
      increment(urlAggregation.device, analytics.device);

      increment(urlAggregation.country, analytics.country);
      increment(urlAggregation.region, analytics.region);
      increment(urlAggregation.city, analytics.city);
      increment(urlAggregation.timezone, analytics.timezone);

      if (analytics.utmSource)
        increment(urlAggregation.utmSource, analytics.utmSource);
      if (analytics.ref) increment(urlAggregation.ref, analytics.ref);
    }

    if (aggregationMap.size === 0) {
      logger.info("Hourly aggregation completed successfully", {
        event: "ANALYTICS_AGGREGATION_SUCCESS",
        rawCount: 0,
        aggregatedUrlCount: 0,
        utcWindowStart: start.toISOString(),
        utcWindowEnd: end.toISOString(),
      });
      return;
    }

    const bulkOps = [...aggregationMap.entries()].map(([urlId, data]) => ({
      updateOne: {
        filter: {
          urlId: new mongoose.Types.ObjectId(urlId),
          utcStartDate: start,
          utcEndDate: end,
        },
        update: {
          $set: {
            clicks: data.clicks,
            os: mapToObject(data.os),
            browser: mapToObject(data.browser),
            device: mapToObject(data.device),
            country: mapToObject(data.country),
            region: mapToObject(data.region),
            city: mapToObject(data.city),
            timezone: mapToObject(data.timezone),
            utmSource: mapToObject(data.utmSource),
            ref: mapToObject(data.ref),
          },
        },
        upsert: true,
      },
    }));

    // Plain objects are valid for Map fields in MongoDB; Mongoose's BulkWrite types expect Map in $set.
    await HourlyAggregatedAnalytics.bulkWrite(
      bulkOps as Parameters<typeof HourlyAggregatedAnalytics.bulkWrite>[0],
      { ordered: false },
    );

    logger.info("Hourly aggregation finished", {
      rawCount: rawAnalytics.length,
      aggregatedUrlCount: aggregationMap.size,
      utcWindowStart: start.toISOString(),
      utcWindowEnd: end.toISOString(),
    });
  }

  async getAggregatedAnalyticsForDate(urlId: string, start: Date, end: Date) {
    const analytics = await HourlyAggregatedAnalytics.find({
      urlId: urlId,
      utcStartDate: {
        $gte: start,
      },
      utcEndDate: {
        $lt: end,
      },
    });

    return analytics;
  }

  async getTotalClicksForUrl(urlId: string) {
    // const analytics = await HourlyAggregatedAnalytics.aggregate([
    //   { $match: { urlId: urlId } },
    //   { $group: { _id: null, totalClicks: { $sum: "$clicks" } } },
    // ]);

    const analytics = await HourlyAggregatedAnalytics.aggregate([
      { $match: { urlId: new mongoose.Types.ObjectId(urlId) } },
      { $group: { _id: null, totalClicks: { $sum: "$clicks" } } },
    ]);

    return analytics[0]?.totalClicks || 0;
  }

  async createRawAnalyticsBatch(analytics: CreateRawAnalyticsDto[]) {
    try {
      const result = await RawAnalytics.insertMany(analytics, {
        ordered: false,
        rawResult: true,
      });

      const validationErrors = result?.mongoose?.validationErrors || [];

      if (validationErrors.length > 0) {
        const failed = validationErrors.map((err: any, index: number) => ({
          index,
          data: analytics[index],
          reason: err.message,
        }));

        return {
          insertedCount: result.insertedCount || 0,
          failed,
        };
      }

      return {
        insertedCount: result.insertedCount || analytics.length,
        failed: [],
      };
    } catch (error: any) {
      logger.error("Raw analytics batch creation failed", {
        event: "ANALYTICS_BATCH_CREATE_FAILED",
        batchSize: analytics.length,
        err: error instanceof Error ? error : undefined,
      });

      if (error?.code === 11000 || error?.writeErrors) {
        const failed = error.writeErrors?.map((e: any) => ({
          index: e.index,
          data: analytics[e.index],
          reason: e.errmsg || e.message,
        }));

        return {
          insertedCount:
            error.result?.nInserted ?? // ← mongoose 7+
            error.result?.result?.nInserted ?? // ← mongoose 6
            analytics.length - failed.length,
          failed: failed || [],
        };
      }

      throw error;
    }
  }

  async getUserDashboardAnalytics(userId: string) {
    const userUrls = await Url.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          status: { $ne: UrlStatus.DELETED },
        },
      },
      {
        // Left join — URLs with zero clicks will still appear
        $lookup: {
          from: "hourlyaggregatedanalytics",
          localField: "_id",
          foreignField: "urlId",
          as: "analytics",
        },
      },
      {
        // Sum clicks; defaults to 0 if analytics array is empty
        $addFields: {
          totalClicks: { $sum: "$analytics.clicks" },
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $project: {
          _id: 0,
          urlId: "$_id",
          shortUrl: 1,
          originalUrl: 1,
          status: 1,
          userId: 1,
          createdAt: 1,
          totalClicks: 1,
          expirationDate: 1,
        },
      },
    ]);

    return userUrls;
  }
}
