// workers/urlExpiry.worker.ts
import { Worker } from "bullmq";
import { createNewRedisConnection } from "../config/redis";
import { serverConfig } from "../config";
import Url, { UrlStatus } from "../models/url.model";
import logger from "../config/logger.config";

async function setUpUrlExpiryWorker() {
  const worker = new Worker(
    serverConfig.URL_EXPIRY_SCHEDULER,
    async (job) => {
      if (job.name === "url-expiry-scheduler-every-10mins") {
        await Url.updateMany(
          {
            expirationDate: { $lt: new Date() },
            status: { $ne: UrlStatus.EXPIRED },
          },
          { status: UrlStatus.EXPIRED },
        );
        logger.info("Expired URLs updated");
      }
    },
    { connection: createNewRedisConnection() },
  );

  worker.on("failed", (job, err) => {
    logger.error(`Job ${job?.id} failed: ${err.message}`);
  });

  return worker;
}

export const startUrlExpiryWorker = async () => {
  setUpUrlExpiryWorker();
  logger.info("URL expiry worker started");
};
