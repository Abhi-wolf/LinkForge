import { Queue } from "bullmq";
import { serverConfig } from "../config";
import { createNewRedisConnection } from "../config/redis";
import logger from "../config/logger.config";

export const aggregationAnalyticsScheduler = new Queue(
  serverConfig.AGGREGATION_ANALYTICS_SCHEDULER,
  {
    connection: createNewRedisConnection(),
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
    },
  },
);

aggregationAnalyticsScheduler.on("error", (error) => {
  logger.error("Aggregation Analytics Queue Error:", error);
});

export const startAnalyticsAggregationScheduler = async () => {
  await aggregationAnalyticsScheduler.upsertJobScheduler(
    "aggregate-hourly-analytics",
    {
      pattern: "0 * * * *", // every hour at minute 0
    },
    {
      name: "aggregate-hourly-analytics",
      data: {},
      opts: {
        removeOnComplete: true,
        removeOnFail: 1000,
      },
    },
  );
};
