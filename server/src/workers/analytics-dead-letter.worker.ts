import { Worker } from "bullmq";
import { createNewRedisConnection } from "../config/redis";
import logger from "../config/logger.config";
import { serverConfig } from "../config";
import { addAnalyticsJob } from "../producers/analytics.producer";

let analyticsDLQWorker: Worker | null = null;

export async function setUpAnalyticsDLQWorker() {
  const worker = new Worker(
    serverConfig.ANALYTICS_DEAD_LETTER_QUEUE, // listen to DLQ
    async (job) => {
      logger.info("DLQ job reprocessing", {
        event: "DLQ_JOB_REPROCESS",
        jobId: job.id,
        originalCorrelationId: job.data.data?.correlationId,
      });

      const payload = job.data.data ?? job.data;
      addAnalyticsJob(payload);
    },
    {
      connection: createNewRedisConnection(),
      concurrency: 5,
    },
  );

  worker.on("failed", (job, err) => {
    logger.error("DLQ job failed to reprocess", {
      event: "DLQ_JOB_REPROCESS_FAILED",
      jobId: job?.id,
      err,
    });
  });

  async function gracefulShutdown() {
    logger.info("Analytics worker shutdown initiated", {
      event: "ANALYTICS_DLQ_WORKER_SHUTDOWN_START",
    });

    await worker.close();

    logger.info("Analytics DLQ worker shutdown completed", {
      event: "ANALYTICS_DLQ_WORKER_SHUTDOWN_SUCCESS",
    });
  }

  process.on("SIGTERM", gracefulShutdown);
  process.on("SIGINT", gracefulShutdown);

  return worker;
}

export async function startAnalyticsDLQWorker() {
  analyticsDLQWorker = await setUpAnalyticsDLQWorker();

  logger.info("Analytics DLQ worker started successfully", {
    event: "ANALYTICS_DLQ_WORKER_START_SUCCESS",
  });
}

export function getAnalyticsDLQWorker() {
  return analyticsDLQWorker;
}
