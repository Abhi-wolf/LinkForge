import logger from "../config/logger.config";
import { initRedis, closeRedis } from "../config/redis";
import { connectDB, disconnectDB } from "../config/db";
import { startAnalyticsWorker } from "../workers/analytics.worker";
import { startAnalyticsAggregationScheduler } from "../queues/analytics.aggregation.scheduler";
import { startAggregationAnalyticsWorker } from "../workers/analytics.aggregation.worker";
import { startUrlExpirySchedulaer } from "../queues/url.expiry.scheduler";
import { startUrlExpiryWorker } from "../workers/url.expiry.worker";
import { startMcpServer } from "../mcp.server";

export async function initializeServices(): Promise<void> {
  logger.info("Initializing services...");

  try {
    await initRedis();

    await connectDB();

    await startAnalyticsWorker();

    await startAnalyticsAggregationScheduler();
    logger.info("✓ Analytics aggregation scheduler started");

    await startAggregationAnalyticsWorker();

    await startUrlExpirySchedulaer();
    logger.info("✓ URL expiry scheduler started");

    await startUrlExpiryWorker();

    await startMcpServer();

    logger.info("All services initialized successfully");
  } catch (error) {
    logger.error("Failed to initialize services:", error);
    throw error;
  }
}

export async function shutdownServices(): Promise<void> {
  logger.info("Shutting down services...");

  try {
    await closeRedis();
    await disconnectDB();
    logger.info("All services shut down successfully");
  } catch (error) {
    logger.error("Error during service shutdown:", error);
    throw error;
  }
}
