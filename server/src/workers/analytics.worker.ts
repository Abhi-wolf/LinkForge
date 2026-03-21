import { Job, Worker } from "bullmq";
import { serverConfig } from "../config";
import { createNewRedisConnection } from "../config/redis";
import logger from "../config/logger.config";
import { AnalyticsRepository } from "../repositories/analytics.repository";
import { AnalyticsService } from "../services/analytics.service";
import { UrlRepository } from "../repositories/url.repository";
import { asyncLocalStorage } from "../utils/helpers/request.helpers";
import { analyticsDeadLetterQueue } from "../queues/analytics.queue";

async function setUpAnalyticsWorker() {
  const analyticsService = new AnalyticsService(
    new AnalyticsRepository(),
    new UrlRepository(),
  );

  const worker = new Worker(
    serverConfig.ANALYTICS_QUEUE,
    async (job) => {
      return asyncLocalStorage.run(
        { correlationId: job.data.correlationId },
        async () => {

          logger.info(`Processing analytics job ${job.id}`);

          await analyticsService.createRawAnalytics(job.data);

          logger.info(`Analytics job ${job.id} completed`);

        },
      );
    },
    {
      connection: createNewRedisConnection(),
      concurrency: 50
    },
  );

  worker.on("failed", async (job: Job | undefined, err: Error) => {

    if (!job) return;

    logger.error(
      `Analytics job ${job.id} failed: `,
      err
    );

    const maxAttempts = job.opts.attempts ?? 3;

    if (job.attemptsMade >= maxAttempts) {

      logger.error(
        `Moving job ${job.id} to analytics DLQ`
      );

      await analyticsDeadLetterQueue.add(
        "analytics_failed_job",
        {
          jobId: job.id,
          queue: job.queueName,
          data: job.data,
          error: err.message,
          attempts: job.attemptsMade,
          failedAt: new Date().toISOString()
        },
        {
          jobId: `failed-${job.id}`
        }
      );
    }
  });


  worker.on("error", (err) => {
    logger.error(`Analytics worker error:`, err);
  });

  process.on("SIGTERM", async () => {
    await worker.close();
  });

  return worker;
}

export async function startAnalyticsWorker() {
  await setUpAnalyticsWorker();
  logger.info("Analytics worker started");
}
