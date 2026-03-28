import { Queue, Worker } from "bullmq";
import { serverConfig } from "../config";
import {
  createNewRedisConnection,
  isRedisAvailable,
  redis,
} from "../config/redis";
import logger from "../config/logger.config";
import { AnalyticsFactory } from "../factories/analytics.factory";

const analyticsService = AnalyticsFactory.getAnalyticsService();

let aggregationQueue: Queue | null = null;
let aggregationWorker: Worker | null = null;
let localAggregationInterval: NodeJS.Timeout | null = null;
let isSwitchingToLocalAgg = false;
let isSwitchingToBullAgg = false;

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

  logger.info("Aggregation analytics scheduler started");
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
        logger.info(`Processing aggregation analytics job ${job.id}`);
        const now = new Date();
        const end = new Date(now);
        end.setUTCMinutes(0, 0, 0);
        const start = new Date(end);
        start.setUTCHours(end.getUTCHours() - 1);

        await analyticsService.aggregateAnalytics(start, end);
      }
    },
    { connection: createNewRedisConnection() },
  );

  aggregationWorker.on("error", (err: Error) => {
    logger.error("Aggregation analytics worker error:", err);
  });
  aggregationWorker.on("completed", (job: any) => {
    logger.info(`Aggregation analytics job ${job.id} completed`);
  });
  aggregationWorker.on("failed", (job: any, err: Error) => {
    logger.error(`Aggregation analytics job ${job?.id} failed:`, err);
  });

  logger.info("Aggregation analytics worker started");
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
  logger.warn("BullMQ aggregation analytics scheduler and worker stopped");
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

        await analyticsService.aggregateAnalytics(start, end);
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
  logger.warn("Local aggregation analytics scheduler stopped");
}

/**
 * Start the aggregation analytics scheduler
 */
export async function startAnalyticsAggregationScheduler() {
  if (isRedisAvailable) {
    await startAggregationBullScheduler();
    await startAggregationBullWorker();
    logger.info("Aggregation analytics started with BullMQ");
  } else {
    startLocalAggregationWorker();
    logger.info("Aggregation analytics started with local scheduler");
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
