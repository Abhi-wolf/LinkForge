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

async function setUpAggregationAnalyticsWorker() {
  const worker = new Worker(
    serverConfig.AGGREGATION_ANALYTICS_SCHEDULER,
    async (job) => {
      logger.info(
        `Processing aggregation analytics job ${job.id} with name ${job.name}`,
      );
      if (job.name === "aggregate-hourly-analytics") {
        const now = new Date();

        const end = new Date(now);
        end.setUTCMinutes(0, 0, 0);

        const start = new Date(end);
        start.setUTCHours(end.getUTCHours() - 1);

        // const start = new Date(now);
        // start.setUTCMinutes(0, 0, 0);

        // const end = new Date(start);
        // end.setUTCHours(start.getUTCHours() + 1);

        await analyticsService.aggregateAnalytics(start, end);
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

export async function startAggregationAnalyticsWorker() {
  await setUpAggregationAnalyticsWorker();
  logger.info("Aggregation analytics worker started");
}
