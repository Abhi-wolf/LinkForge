import { Queue, Worker } from "bullmq";
import { serverConfig } from "../config";
import {
  createNewRedisConnection,
  isRedisAvailable,
  redis,
} from "../config/redis";
import logger from "../config/logger.config";
import { asyncLocalStorage } from "../utils/helpers/request.helpers";
import { AnalyticsFactory } from "../factories/analytics.factory";

const analyticsService = AnalyticsFactory.getAnalyticsService();

let aggregationQueue: Queue | null = null;
let aggregationWorker: Worker | null = null;
let localAggregationInterval: NodeJS.Timeout | null = null;
let isSwitchingToLocalAgg = false;
let isSwitchingToBullAgg = false;

// TODO: analytics.worker.ts shares one batch + isFlushing across concurrent jobs (concurrency: 50) — use concurrency 1, a mutex, or per-job inserts.

/**
 * Start the aggregation analytics scheduler using BullMQ
 */
async function startAggregationBullScheduler() {
  if (aggregationQueue) return;

  aggregationQueue = new Queue(serverConfig.AGGREGATION_ANALYTICS_SCHEDULER, {
    connection: createNewRedisConnection(),
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 2000 },
    },
  });

  aggregationQueue.on("error", (error) => {
    logger.error("Aggregation Analytics Queue Error:", error);
  });

  await aggregationQueue.upsertJobScheduler(
    "aggregate-hourly-analytics",
    { pattern: "0 * * * *" },
    {
      name: "aggregate-hourly-analytics",
      data: {},
      opts: {
        removeOnComplete: true,
        removeOnFail: { age: 7 * 24 * 3600, count: 1000 },
      },
    },
  );

  logger.info("Aggregation analytics scheduler started successfully", {
    event: "ANALYTICS_AGGREGATION_SCHEDULER_START_SUCCESS"
  });
}

/**
 * Start the aggregation analytics worker using BullMQ
 */
async function startAggregationBullWorker() {
  if (aggregationWorker) return;

  aggregationWorker = new Worker(
    serverConfig.AGGREGATION_ANALYTICS_SCHEDULER,
    async (job) => {
      if (job.name === "aggregate-hourly-analytics") {
        const now = new Date();
        const end = new Date(now);
        end.setUTCMinutes(0, 0, 0);
        const start = new Date(end);
        start.setUTCHours(end.getUTCHours() - 1);

        const correlationId = `agg-${job.id}-${start.toISOString()}`;
        await asyncLocalStorage.run({ correlationId }, async () => {
          logger.info("Processing aggregation analytics job", {
            event: "ANALYTICS_AGGREGATION_JOB_PROCESSING",
            jobId: job.id,
            correlationId
          });
          await analyticsService.aggregateAnalytics(start, end);
        });
      }
    },
    { connection: createNewRedisConnection() },
  );

  aggregationWorker.on("error", (err: Error) => {
    logger.error("Aggregation analytics worker encountered error", {
      event: "ANALYTICS_AGGREGATION_WORKER_ERROR",
      err: err instanceof Error ? err : undefined
    });
  });
  aggregationWorker.on("completed", (job: any) => {
    logger.info("Aggregation analytics job completed successfully", {
      event: "ANALYTICS_AGGREGATION_JOB_SUCCESS",
      jobId: job?.id
    });
  });
  aggregationWorker.on("failed", (job: any, err: Error) => {
    logger.error("Aggregation analytics job failed", {
      event: "ANALYTICS_AGGREGATION_JOB_FAILED",
      jobId: job?.id,
      err: err instanceof Error ? err : undefined
    });
  });

  logger.info("Aggregation analytics worker started successfully", {
    event: "ANALYTICS_AGGREGATION_WORKER_START_SUCCESS"
  });
}

/**
 * Stop the aggregation analytics worker and scheduler using BullMQ
 */
async function stopAggregationBullWorkerAndScheduler() {
  if (aggregationWorker) {
    await aggregationWorker.close();
    aggregationWorker = null;
  }
  if (aggregationQueue) {
    await aggregationQueue.close();
    aggregationQueue = null;
  }
  logger.warn("BullMQ aggregation analytics scheduler and worker stopped", {
    event: "ANALYTICS_AGGREGATION_BULLMQ_STOP_SUCCESS"
  });
}

/**
 * Start the local aggregation analytics worker
 */
function startLocalAggregationWorker() {
  if (localAggregationInterval) return;

  logger.warn(
    "Redis not available, starting local aggregation analytics scheduler",
  );

  localAggregationInterval = setInterval(
    async () => {
      try {
        const now = new Date();
        const end = new Date(now);
        end.setUTCMinutes(0, 0, 0);
        const start = new Date(end);
        start.setUTCHours(end.getUTCHours() - 1);

        const correlationId = `agg-local-${start.toISOString()}`;
        await asyncLocalStorage.run({ correlationId }, async () => {
          await analyticsService.aggregateAnalytics(start, end);
        });
      } catch (error) {
        logger.error("Local aggregation analytics job failed", error);
      }
    },
    60 * 60 * 1000,
  );
}

/**
 * Stop the local aggregation analytics worker
 */
function stopLocalAggregationWorker() {
  if (!localAggregationInterval) return;
  clearInterval(localAggregationInterval);
  localAggregationInterval = null;
  logger.warn("Local aggregation analytics scheduler stopped", {
    event: "ANALYTICS_AGGREGATION_LOCAL_SCHEDULER_STOP_SUCCESS"
  });
}

/**
 * Start the aggregation analytics scheduler
 */
export async function startAnalyticsAggregationScheduler() {
  if (isRedisAvailable) {
    await startAggregationBullScheduler();
    await startAggregationBullWorker();
    logger.info("Aggregation analytics started with BullMQ", {
      event: "ANALYTICS_AGGREGATION_BULLMQ_START_SUCCESS"
    });
  } else {
    startLocalAggregationWorker();
    logger.info("Aggregation analytics started with local scheduler", {
      event: "ANALYTICS_AGGREGATION_LOCAL_START_SUCCESS"
    });
  }

  redis.once("ready", async () => {
    if (isSwitchingToBullAgg) return;
    isSwitchingToBullAgg = true;
    try {
      logger.info("Redis connected, switching aggregation analytics to BullMQ");
      stopLocalAggregationWorker();
      await startAggregationBullScheduler();
      await startAggregationBullWorker();
    } finally {
      isSwitchingToBullAgg = false;
    }
  });

  redis.once("close", async () => {
    if (isSwitchingToLocalAgg) return;
    if (!aggregationWorker && !aggregationQueue) return;
    isSwitchingToLocalAgg = true;
    try {
      logger.warn(
        "Redis closed, switching aggregation analytics to local scheduler",
      );
      await stopAggregationBullWorkerAndScheduler();
      startLocalAggregationWorker();
    } finally {
      isSwitchingToLocalAgg = false;
    }
  });
}
