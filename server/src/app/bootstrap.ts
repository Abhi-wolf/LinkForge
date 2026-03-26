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
    // Initialize core services
    await initRedis();
    logger.info("✓ Redis initialized");

    await connectDB();
    logger.info("✓ Database connected");

    // Start background workers and schedulers
    await startAnalyticsWorker();
    logger.info("✓ Analytics worker started");

    await startAnalyticsAggregationScheduler();
    logger.info("✓ Analytics aggregation scheduler started");

    await startAggregationAnalyticsWorker();
    logger.info("✓ Aggregation analytics worker started");

    await startUrlExpirySchedulaer();
    logger.info("✓ URL expiry scheduler started");

    await startUrlExpiryWorker();
    logger.info("✓ URL expiry worker started");

    await startMcpServer();
    logger.info("✓ MCP server started");

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
    logger.info("✓ Redis connection closed");

    await disconnectDB();
    logger.info("✓ Database connection closed");

    logger.info("All services shut down successfully");
  } catch (error) {
    logger.error("Error during service shutdown:", error);
    throw error;
  }
}
