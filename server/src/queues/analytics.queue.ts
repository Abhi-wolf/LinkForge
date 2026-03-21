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
    removeOnFail: {
      age: 7 * 24 * 3600,   // Keep failed jobs for 7 days
      count: 1000   // Keep only the last 1000 failures
    },
    removeOnComplete: {
      age: 24 * 3600,   // keep for 24 hours
      count: 1000,      // keep last 1000 completed jobs
    },
  },
});

analyticsQueue.on("error", (error) => {
  logger.error(`Submission Queue Error: `, error);
});


export const analyticsDeadLetterQueue = new Queue(serverConfig.ANALYTICS_DEAD_LETTER_QUEUE, {
  connection: createNewRedisConnection(),
})

analyticsDeadLetterQueue.on("error", (error) => {
  logger.error(`Analytics Dead Letter Queue Error: `, error);
});