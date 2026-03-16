import { Queue } from "bullmq";
import { createNewRedisConnection } from "../config/redis";
import logger from "../config/logger.config";
import { serverConfig } from "../config";

export const analyticsQueue = new Queue(serverConfig.ANALYTICS_QUEUE, {
  connection: createNewRedisConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
  },
});

analyticsQueue.on("error", (error) => {
  logger.error("Submission Queue Error:", error);
});

analyticsQueue.on("waiting", (job) => {
  logger.info(`Job ${job.id} is waiting to be processed`);
});
