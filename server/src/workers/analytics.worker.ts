import { Job, Worker } from "bullmq";
import { serverConfig } from "../config";
import { createNewRedisConnection } from "../config/redis";
import logger from "../config/logger.config";
import { asyncLocalStorage } from "../utils/helpers/request.helpers";
import { analyticsDeadLetterQueue } from "../queues/analytics.queue";
import { AnalyticsFactory } from "../factories/analytics.factory";
import { analyticsJobFailures } from "../metrics/queue.metrics";

let analyticsWorker: Worker | null = null;

// batching the job and inserting in bulk
async function setUpAnalyticsWorker() {
  const analyticsRepository = AnalyticsFactory.getAnalyticsRepository();

  // batching the job and inserting in bulk
  let batch: any[] = [];
  let isFlushing = false; // to stop multiple flushes at the same time

  // TODO: change the batchsize and batchtimeout
  const batchSize = 20;
  const batchTimeout = 5000; // flush after every 5 second

  async function flushBatch() {
    if (batch.length === 0 || isFlushing) return;

    isFlushing = true;

    const toInsert = [...batch];
    batch = [];

    try {
      const result =
        await analyticsRepository.createRawAnalyticsBatch(toInsert);

      logger.info("Analytics batch flushed successfully", {
        event: "ANALYTICS_BATCH_FLUSH_SUCCESS",
        insertedCount: result.insertedCount,
        failedCount: result.failed.length,
      });

      if (result?.failed?.length > 0) {
        logger.error("Analytics batch processing failed, moving to DLQ", {
          event: "ANALYTICS_BATCH_FAILED",
          failedCount: result.failed.length,
          // err: error instanceof Error ? error : undefined
        });

        analyticsJobFailures.inc(
          { error_type: "ANALYTICS_BATCH_FAILED" },
          result.failed.length,
        );

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
              },
            ),
          ),
        );
      }
    } catch (error) {
      logger.error("Analytics batch flush failed, moving all to DLQ", {
        event: "ANALYTICS_BATCH_FLUSH_FAILED",
        batchSize: toInsert.length,
        err: error instanceof Error ? error : undefined,
      });

      analyticsJobFailures.inc(
        { error_type: "ANALYTICS_BATCH_FLUSH_FAILED" },
        toInsert.length,
      );

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
            },
          ),
        ),
      );
    } finally {
      isFlushing = false;
      // Re-flush immediately if new items arrived during flush
      if (batch.length >= batchSize) {
        await flushBatch();
      }
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
          logger.info("Analytics job queued for batch processing", {
            event: "ANALYTICS_JOB_QUEUED",
            jobId: job.id,
            correlationId: job.data.correlationId,
          });

          batch.push({
            ...job.data,
            bullJobId: job.id,
          });
        },
      );
    },
    {
      connection: createNewRedisConnection(),
      concurrency: 50,
    },
  );

  worker.on("failed", async (job: Job | undefined, err: Error) => {
    if (!job) return;

    logger.error("Analytics job failed before batching", {
      event: "ANALYTICS_JOB_BATCH_FAILED",
      jobId: job?.id,
      correlationId: job?.data?.correlationId,
      err: err instanceof Error ? err : undefined,
    });
  });

  worker.on("error", (err) => {
    logger.error("Analytics worker encountered error", {
      event: "ANALYTICS_WORKER_ERROR",
      err: err instanceof Error ? err : undefined,
    });
  });

  async function gracefulShutdown() {
    logger.info("Analytics worker shutdown initiated", {
      event: "ANALYTICS_WORKER_SHUTDOWN_START",
    });

    clearInterval(flushInterval);

    await flushBatch();

    await worker.close();

    logger.info("Analytics worker shutdown completed", {
      event: "ANALYTICS_WORKER_SHUTDOWN_SUCCESS",
    });
  }

  process.on("SIGTERM", gracefulShutdown);
  process.on("SIGINT", gracefulShutdown);

  return worker;
}

export async function startAnalyticsWorker() {
  analyticsWorker = await setUpAnalyticsWorker(); // ← hold the reference

  logger.info("Analytics worker started successfully", {
    event: "ANALYTICS_WORKER_START_SUCCESS",
  });
}

export function getAnalyticsWorker() {
  return analyticsWorker;
}
