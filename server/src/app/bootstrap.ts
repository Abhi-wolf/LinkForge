import logger from "../config/logger.config";
import { initRedis, isRedisAvailable } from "../config/redis";
import { connectDB, disconnectDB } from "../config/db";
// import { startAnalyticsWorker } from "../workers/analytics.worker";
// import { startAggregationAnalyticsWorker } from "../workers/analytics.aggregation.worker";
import { startUrlExpiryWorker } from "../workers/url.expiry.worker";
import { startAnalyticsAggregationScheduler } from "../workers/analytics.aggregation.worker";
import { startAnalyticsWorker } from "../workers/analytics.worker";
// import { startMcpServer } from "../mcp.server";

export async function initializeServices(): Promise<void> {
  logger.info("Service initialization started", {
    event: "SERVICES_INIT_START"
  });

  try {
    logger.info("Initializing Redis connection", {
      event: "REDIS_INIT_START"
    });
    await initRedis();
    logger.info("Redis connection initialized successfully", {
      event: "REDIS_INIT_SUCCESS",
      available: isRedisAvailable
    });

    logger.info("Connecting to database", {
      event: "DB_CONNECT_START"
    });
    await connectDB();

    if (isRedisAvailable) {
      logger.info("Starting analytics worker", {
        event: "ANALYTICS_WORKER_START"
      });
      await startAnalyticsWorker();
    } else {
      logger.warn("Redis unavailable, skipping analytics worker", {
        event: "ANALYTICS_WORKER_SKIPPED"
      });
    }

    logger.info("Starting URL expiry worker", {
      event: "URL_EXPIRY_WORKER_START"
    });
    await startUrlExpiryWorker();

    logger.info("Starting analytics aggregation scheduler", {
      event: "ANALYTICS_AGGREGATION_START"
    });
    await startAnalyticsAggregationScheduler();

    logger.info("All services initialized successfully", {
      event: "SERVICES_INITIALIZATION_SUCCESS"
    });
  } catch (error) {
    logger.error("Service initialization failed", {
      event: "SERVICES_INIT_FAILED",
      err: error instanceof Error ? error : undefined
    });
    throw error;
  }
}

export async function shutdownServices(): Promise<void> {
  logger.info("Service shutdown initiated", {
    event: "SERVICES_SHUTDOWN_START"
  });

  try {
    logger.info("Disconnecting from database", {
      event: "DB_DISCONNECT_START"
    });
    await disconnectDB();
    logger.info("Database disconnected successfully", {
      event: "DB_DISCONNECT_SUCCESS"
    });

    logger.info("All services shut down successfully", {
      event: "SERVICES_SHUTDOWN_SUCCESS"
    });
  } catch (error) {
    logger.error("Service shutdown failed", {
      event: "SERVICES_SHUTDOWN_FAILED",
      err: error instanceof Error ? error : undefined
    });
    throw error;
  }
}
