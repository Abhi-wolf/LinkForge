import { Job, Worker } from "bullmq";
import { serverConfig } from "../config";
import { createNewRedisConnection } from "../config/redis";
import logger from "../config/logger.config";
import { asyncLocalStorage } from "../utils/helpers/request.helpers";
import { analyticsDeadLetterQueue } from "../queues/analytics.queue";
import { AnalyticsFactory } from "../factories/analytics.factory";

/* async function setUpAnalyticsWorker() {
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
} */

// batching the job and inserting in bulk
async function setUpAnalyticsWorker() {

  const analyticsRepository = AnalyticsFactory.getAnalyticsRepository();

  // batching the job and inserting in bulk
  let batch: any[] = [];
  let isFlushing = false;  // to stop multiple flushes at the same time

  // TODO: change the batchsize and batchtimeout
  const batchSize = 20;
  const batchTimeout = 5000; // flush after every 5 second

  async function flushBatch() {
    if (batch.length == 0) return;
    if (isFlushing) return;

    isFlushing = true;

    const toInsert = [...batch];
    batch = [];

    try {
      const result =
        await analyticsRepository.createRawAnalyticsBatch(toInsert);
      logger.info(
        `Flushed analytics: inserted=${result.insertedCount}, failed=${result.failed.length}`
      );

      if (result?.failed?.length > 0) {
        logger.error(`${result.failed.length} analytics failed, moving to DLQ`);

        await Promise.all(
          result.failed.map((failed: any) =>
            analyticsDeadLetterQueue.add(
              "analytics_failed_job",
              {
                data: failed.data,
                error: failed.reason,
                failedAt: new Date().toISOString(),
              },
              {
                jobId: `failed-${failed.data.correlationId}-${failed.data.bullJobId}`,
              }
            )
          )
        );
      }
    } catch (error) {
      logger.error("Failed to flush analytics batch, moving all to DLQ", error);

      await Promise.all(
        toInsert.map((item) =>
          analyticsDeadLetterQueue.add(
            "analytics_failed_job",
            {
              data: item,
              error:
                error instanceof Error ? error.message : "Unknown flush error",
              failedAt: new Date().toISOString(),
            },
            {
              jobId: `failed-${item.correlationId}-${item.bullJobId}`,
            }
          )
        )
      );
    } finally {
      isFlushing = false;
    }
  }

  // Flush batch periodically
  const flushInterval = setInterval(flushBatch, batchTimeout);

  const worker = new Worker(
    serverConfig.ANALYTICS_QUEUE,
    async (job) => {
      return asyncLocalStorage.run(
        { correlationId: job.data.correlationId },
        async () => {
          logger.info(`Queuing analytics job ${job.id}`);

          batch.push({
            ...job.data,
            bullJobId: job.id
          });

          // Flush immediately if batch is full
          if (batch.length >= batchSize) {
            await flushBatch();
          }
        }
      );
    },
    {
      connection: createNewRedisConnection(),
      concurrency: 50,
    }
  );

  worker.on("failed", async (job: Job | undefined, err: Error) => {
    if (!job) return;

    logger.error(`Analytics job ${job.id} failed before batching:`, err);
  });

  worker.on("error", (err) => {
    logger.error(`Analytics worker error:`, err);
  });

  async function gracefulShutdown() {
    logger.info("Shutting down analytics worker...");

    clearInterval(flushInterval);

    await flushBatch();

    await worker.close();

    logger.info("Analytics worker closed");

    process.exit(0);
  }

  process.on("SIGTERM", gracefulShutdown);
  process.on("SIGINT", gracefulShutdown);

  return worker;
}

export async function startAnalyticsWorker() {
  await setUpAnalyticsWorker();
  logger.info("Analytics worker started");
}
