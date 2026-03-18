import { Queue } from "bullmq";
import { serverConfig } from "../config";
import { createNewRedisConnection } from "../config/redis";
import logger from "../config/logger.config";

export const urlExpiryScheduler = new Queue(serverConfig.URL_EXPIRY_SCHEDULER, {
  connection: createNewRedisConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
  },
});

urlExpiryScheduler.on("error", (error) => {
  logger.error("Url expiry scheduler error:", error);
});

export const startUrlExpirySchedulaer = async () => {
  await urlExpiryScheduler.upsertJobScheduler(
    "url-expiry-scheduler-every-10mins",
    {
      pattern: "0 */10 * * * *", // every 10 mins
    },
    {
      name: "url-expiry-scheduler-every-10mins",
      data: {},
      opts: {
        removeOnComplete: true,
        removeOnFail: 1000,
      },
    },
  );
};
