import mongoose from "mongoose";
import {
  HourlyAggregatedAnalytics,
  RawAnalytics,
} from "../models/analytics.model";
import logger from "../config/logger.config";

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

    // console.log("START : ", start, " END : ", end);
    // console.log("RAW ANALYTICS : ", rawAnalytics);

    logger.info(`Starting aggregating analytics for date range : ${start} - ${end}`);

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
    // console.log("AGGREGATION MAP : ", aggregationMap);


    for (const [urlId, data] of aggregationMap) {
      await HourlyAggregatedAnalytics.create({
        urlId,
        utcEndDate: data.utcEndDate,
        utcStartDate: data.utcStartDate,

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
      });
    }

    logger.info(`Ending aggregating analytics for date range : ${start} - ${end}`);
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
}
