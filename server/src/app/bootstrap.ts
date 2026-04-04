import logger from "../config/logger.config";
import { closeRedis, initRedis, isRedisAvailable } from "../config/redis";
import { connectDB, disconnectDB } from "../config/db";
import { startUrlExpiryWorker } from "../workers/url.expiry.worker";
import { startAnalyticsAggregationScheduler } from "../workers/analytics.aggregation.worker";
import { startAnalyticsWorker } from "../workers/analytics.worker";
import { startMcpServer } from "../mcp.server";
import { startAnalyticsDLQWorker } from "../workers/analytics-dead-letter.worker";

export async function initializeServices(): Promise<void> {
  logger.info("Service initialization started", {
    event: "SERVICES_INIT_START",
  });

  try {
    await initRedis();
    await connectDB();

    if (isRedisAvailable) {
      await startAnalyticsWorker();
      await startAnalyticsDLQWorker();
    } else {
      logger.warn("Redis unavailable, skipping analytics workers", {
        event: "ANALYTICS_WORKERS_SKIPPED",
      });
    }

    await startUrlExpiryWorker();
    await startAnalyticsAggregationScheduler();
    await startMcpServer();

    logger.info("All services initialized successfully", {
      event: "SERVICES_INITIALIZATION_SUCCESS",
    });
  } catch (error) {
    logger.error("Service initialization failed", {
      event: "SERVICES_INIT_FAILED",
      err: error instanceof Error ? error : undefined,
    });
    throw error;
  }
}

// worker shutdown is written in the worker files themselves
export async function shutdownServices(): Promise<void> {
  logger.info("Service shutdown initiated", {
    event: "SERVICES_SHUTDOWN_START",
  });

  try {
    await disconnectDB();
    await closeRedis();

    logger.info("All services shut down successfully", {
      event: "SERVICES_SHUTDOWN_SUCCESS",
    });
  } catch (error) {
    logger.error("Service shutdown failed", {
      event: "SERVICES_SHUTDOWN_FAILED",
      err: error instanceof Error ? error : undefined,
    });
    throw error;
  }
}
