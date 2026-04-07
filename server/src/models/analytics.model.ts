import mongoose, { Document } from "mongoose";

export interface IRawAnalyticsModel extends Document {
  urlId: mongoose.Types.ObjectId;
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

export interface IHourlyAggregatedAnalyticsModel extends Document {
  urlId: mongoose.Types.ObjectId;
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

const rawAnalyticsSchema = new mongoose.Schema<IRawAnalyticsModel>(
  {
    urlId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Url",
    },
    os: {
      type: String,
      required: true,
    },
    browser: {
      type: String,
      required: true,
    },
    device: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    region: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    timezone: {
      type: String,
      required: true,
    },
    utcDate: {
      type: Date,
      default: Date.now,
    },
    utmSource: {
      type: String,
      default: "unknown",
    },
    ref: {
      type: String,
      default: "unknown",
    },
  },
  {
    timestamps: true,
    autoIndex: false,
  },
);

// expires after 24 hours
rawAnalyticsSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

const RawAnalytics = mongoose.model<IRawAnalyticsModel>(
  "RawAnalytics",
  rawAnalyticsSchema,
);

const hourlyAggregatedAnalyticsSchema =
  new mongoose.Schema<IHourlyAggregatedAnalyticsModel>(
    {
      urlId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "Url",
      },
      clicks: {
        type: Number,
        default: 0,
      },
      os: {
        type: Map,
        of: Number,
        default: {},
      },
      browser: {
        type: Map,
        of: Number,
        default: {},
      },
      device: {
        type: Map,
        of: Number,
        default: {},
      },
      country: {
        type: Map,
        of: Number,
        default: {},
      },
      region: {
        type: Map,
        of: Number,
        default: {},
      },
      city: {
        type: Map,
        of: Number,
        default: {},
      },
      timezone: {
        type: Map,
        of: Number,
        default: {},
      },
      utcStartDate: {
        type: Date,
        required: true,
      },
      utcEndDate: {
        type: Date,
        required: true,
      },
      utmSource: {
        type: Map,
        of: Number,
        default: {},
      },
      ref: {
        type: Map,
        of: Number,
        default: {},
      },
    },
    {
      timestamps: true,
      autoIndex: false,
    },
  );


hourlyAggregatedAnalyticsSchema.index(
  { urlId: 1, utcStartDate: 1, utcEndDate: 1 },
  { unique: true },
);

const HourlyAggregatedAnalytics =
  mongoose.model<IHourlyAggregatedAnalyticsModel>(
    "HourlyAggregatedAnalytics",
    hourlyAggregatedAnalyticsSchema,
  );

export { RawAnalytics, HourlyAggregatedAnalytics };
