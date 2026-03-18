import { Worker } from "bullmq";
import { serverConfig } from "../config";
import { createNewRedisConnection } from "../config/redis";
import logger from "../config/logger.config";
import { AnalyticsRepository } from "../repositories/analytics.repository";
import { AnalyticsService } from "../services/analytics.service";
import { UrlRepository } from "../repositories/url.repository";
import { asyncLocalStorage } from "../utils/helpers/request.helpers";

const analyticsService = new AnalyticsService(
  new AnalyticsRepository(),
  new UrlRepository(),
);

async function setUpAnalyticsWorker() {
  const worker = new Worker(
    serverConfig.ANALYTICS_QUEUE,
    async (job) => {
      return asyncLocalStorage.run(
        { correlationId: job.data.correlationId },
        async () => {
          logger.info(`Processing analytics job ${job.id}`);

          try {
            await analyticsService.createRawAnalytics(job.data);
            logger.info(`Analytics job ${job.id} completed successfully`);
          } catch (error) {
            logger.error(`Error processing analytics job ${job.id}: ${error}`);
            throw error;
          }
        },
      );
    },
    {
      connection: createNewRedisConnection(),
    },
  );

  worker.on("error", (err) => {
    logger.error(`Analytics worker error : ${err}`);
  });
}

export async function startAnalyticsWorker() {
  await setUpAnalyticsWorker();
  logger.info("Analytics worker started");
}
