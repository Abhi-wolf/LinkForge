import { Queue, Worker } from "bullmq";
import {
  createNewRedisConnection,
  isRedisAvailable,
  redis,
} from "../config/redis";
import { serverConfig } from "../config";
import logger from "../config/logger.config";
import { UrlFactory } from "../factories/url.factory";

const urlService = UrlFactory.getUrlService();

let localInterval: NodeJS.Timeout | null = null;
let urlExpirySchedulerQueue: Queue | null = null;
let urlExpirySchedulerWorker: Worker | null = null;
let isSwitchingToLocal = false;
let isSwitchingToBull = false;

/**
 * Start the URL expiry scheduler using BullMQ
 */
async function startUrlExpiryBullScheduler() {
  if (urlExpirySchedulerQueue) return;

  urlExpirySchedulerQueue = new Queue(serverConfig.URL_EXPIRY_SCHEDULER, {
    connection: createNewRedisConnection(),
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
    },
  });

  urlExpirySchedulerQueue.on("error", (error) => {
    logger.error("Url expiry scheduler error:", error);
  });

  await urlExpirySchedulerQueue.upsertJobScheduler(
    "url-expiry-scheduler-every-10mins",
    {
      pattern: "0 */16 * * * *", // every 16 mins
    },
    {
      name: "url-expiry-scheduler-every-10mins",
      data: {},
      opts: {
        removeOnComplete: true,
        removeOnFail: {
          age: 7 * 24 * 3600,
          count: 1000,
        },
      },
    },
  );

  logger.info("URL expiry scheduler started");
}

/**
 * Start the URL expiry worker using BullMQ
 */
async function startUrlExpiryBullWorker() {
  if (urlExpirySchedulerWorker) return;

  urlExpirySchedulerWorker = new Worker(
    serverConfig.URL_EXPIRY_SCHEDULER,
    async (job) => {
      if (job.name === "url-expiry-scheduler-every-10mins") {
        await urlService.runUrlExpiryJob();
      }
    },
    { connection: createNewRedisConnection() },
  );

  urlExpirySchedulerWorker.on("failed", (job, err) => {
    logger.error(`Job ${job?.id} failed: `, err);
  });

  urlExpirySchedulerWorker.on("completed", (job) => {
    logger.info(`Job ${job?.id} completed`);
  });

  logger.info("URL expiry worker started");
}

/**
 * Start the local URL expiry worker
 */
function startLocalUrlExpiryWorker() {
  if (localInterval) return;

  logger.warn("Redis not available, starting local URL expiry scheduler");

  localInterval = setInterval(
    async () => {
      try {
        await urlService.runUrlExpiryJob();
      } catch (error) {
        logger.error("Local expiry job failed", error);
      }
    },
    16 * 60 * 1000,
  ); // every 16 minutes
}

/**
 * Stop the URL expiry scheduler and worker using BullMQ
 */
async function stopUrlExpiryBullWorkerAndScheduler() {
  if (urlExpirySchedulerWorker) {
    await urlExpirySchedulerWorker.close();
    urlExpirySchedulerWorker = null;
  }

  if (urlExpirySchedulerQueue) {
    await urlExpirySchedulerQueue.close();
    urlExpirySchedulerQueue = null;
  }

  logger.warn("BULLMQ URL expiry scheduler and worker stopped");
}

/**
 * Stop the local URL expiry worker
 */
function stopLocalUrlExpiryWorker() {
  if (!localInterval) return;

  clearInterval(localInterval);
  localInterval = null;

  logger.warn("Local URL expiry scheduler stopped");
}

/**
 * Start the URL expiry worker
 */
export async function startUrlExpiryWorker() {
  if (isRedisAvailable) {
    await startUrlExpiryBullScheduler();
    await startUrlExpiryBullWorker();
  } else {
    startLocalUrlExpiryWorker();
  }

  // Register once, not on every call
  redis.once("ready", async () => {
    if (isSwitchingToBull) return;
    isSwitchingToBull = true;

    try {
      logger.info("Redis connected, switching to BullMQ URL expiry system");
      stopLocalUrlExpiryWorker();
      await startUrlExpiryBullScheduler();
      await startUrlExpiryBullWorker();
    } finally {
      isSwitchingToBull = false;
    }
  });

  redis.once("close", async () => {
    if (isSwitchingToLocal) return;
    if (!urlExpirySchedulerWorker && !urlExpirySchedulerQueue) return;

    isSwitchingToLocal = true;
    try {
      logger.warn("Redis closed, switching to local URL expiry system");
      await stopUrlExpiryBullWorkerAndScheduler();
      startLocalUrlExpiryWorker();
    } finally {
      isSwitchingToLocal = false;
    }
  });
}
