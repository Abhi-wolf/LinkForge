import { Worker } from "bullmq";
import { serverConfig } from "../config";
import { createNewRedisConnection } from "../config/redis";
import logger from "../config/logger.config";
import { AnalyticsRepository } from "../repositories/analytics.repository";
import { AnalyticsService } from "../services/analytics.service";
import { UrlRepository } from "../repositories/url.repository";

const analyticsService = new AnalyticsService(
  new AnalyticsRepository(),
  new UrlRepository(),
);

async function setUpAnalyticsWorker() {
  const worker = new Worker(
    serverConfig.ANALYTICS_QUEUE,
    async (job) => {
      logger.info(`Processing analytics job ${job.id}`);

      const data = job.data;
      console.log("ANALYTICS JOB DATA : ", data);

      try {
        await analyticsService.createRawAnalytics(job.data);
        logger.info(`Analytics job ${job.id} completed successfully`);
      } catch (error) {
        logger.error(`Error processing analytics job ${job.id}: ${error}`);
        throw error;
      }
    },
    {
      connection: createNewRedisConnection(),
    },
  );

  worker.on("error", (err) => {
    logger.error(`Analytics worker error : ${err}`);
  });

  worker.on("completed", (job) => {
    logger.info(`Analytics job ${job.id} processed`);
  });

  worker.on("failed", (job, error) => {
    logger.error(`Analytics job ${job?.id} failed: ${error.message} `);
  });
}

export async function startAnalyticsWorker() {
  await setUpAnalyticsWorker();
  logger.info("Analytics worker started");
}
