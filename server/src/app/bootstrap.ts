import logger from "../config/logger.config";
import { initRedis } from "../config/redis";
import { connectDB, disconnectDB } from "../config/db";
// import { startAnalyticsWorker } from "../workers/analytics.worker";
// import { startAggregationAnalyticsWorker } from "../workers/analytics.aggregation.worker";
import { startUrlExpiryWorker } from "../workers/url.expiry.worker";
import { startAnalyticsAggregationScheduler } from "../workers/analytics.aggregation.worker";
// import { startMcpServer } from "../mcp.server";

export async function initializeServices(): Promise<void> {
  logger.info("Initializing services...");

  try {
    await initRedis();

    await connectDB();

    // if (isRedisAvailable) {
    //   await startAnalyticsWorker();
    // }
    
    await startUrlExpiryWorker();
    await startAnalyticsAggregationScheduler();
    //   await startMcpServer();

    logger.info("All services initialized successfully");
  } catch (error) {
    logger.error("Failed to initialize services:", error);
    throw error;
  }
}

export async function shutdownServices(): Promise<void> {
  logger.info("Shutting down services...");

  try {
    // await closeRedis();
    await disconnectDB();
    logger.info("All services shut down successfully");
  } catch (error) {
    logger.error("Error during service shutdown:", error);
    throw error;
  }
}
