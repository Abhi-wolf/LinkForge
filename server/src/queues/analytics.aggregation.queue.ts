import { Queue } from "bullmq";
import { serverConfig } from "../config";
import { createNewRedisConnection } from "../config/redis";
import logger from "../config/logger.config";

export const aggregationAnalyticsQueue = new Queue(
  serverConfig.AGGREGATION_ANALYTICS_QUEUE,
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

aggregationAnalyticsQueue.on("error", (error) => {
  logger.error("Aggregation Analytics Queue Error:", error);
});
