import {
  HourlyAggregatedAnalytics,
  RawAnalytics,
} from "../models/analytics.model";

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

  async findHourlyAggregatedAnalyticsByUrlId(urlId: string) {
    const analytics = await HourlyAggregatedAnalytics.find({ urlId });
    return analytics;
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
    }
    console.log("AGGREGATION MAP : ", aggregationMap);

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
      });
    }
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
    const analytics = await HourlyAggregatedAnalytics.find({ urlId });

    let totalClicks = 0;
    for (const data of analytics) {
      totalClicks += data.clicks;
    }

    return totalClicks;
  }
}
