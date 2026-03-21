import { Worker } from "bullmq";
import { createNewRedisConnection } from "../config/redis";
import { serverConfig } from "../config";
import Url, { UrlStatus } from "../models/url.model";
import logger from "../config/logger.config";
import { CacheRepository } from "../repositories/cache.repository";

async function setUpUrlExpiryWorker() {
  const cacheRepository = new CacheRepository();
  const worker = new Worker(
    serverConfig.URL_EXPIRY_SCHEDULER,
    async (job) => {
      if (job.name === "url-expiry-scheduler-every-10mins") {

        const expiredUrls = await Url.find({
          expirationDate: { $lt: new Date() },
          status: { $ne: UrlStatus.EXPIRED },
        }).select("shortUrl");

        if (expiredUrls.length > 0) {
          await Url.updateMany(
            {
              expirationDate: { $lt: new Date() },
              status: { $ne: UrlStatus.EXPIRED },
            },
            { status: UrlStatus.EXPIRED },
          );

          logger.info(`Expired URLs updated`);

          // Clear cache for each expired URL
          await Promise.all(
            expiredUrls.map((url) =>
              cacheRepository.deleteUrlMapping(url.shortUrl),
            ),
          );

          logger.info(`${expiredUrls.length} expired URLs updated and cleared from cache`);
        }
      }
    },
    { connection: createNewRedisConnection() },
  );

  worker.on("failed", (job, err) => {
    logger.error(`Job ${job?.id} failed: `, err);
  });

  return worker;
}

export const startUrlExpiryWorker = async () => {
  setUpUrlExpiryWorker();
  logger.info("URL expiry worker started");
};
