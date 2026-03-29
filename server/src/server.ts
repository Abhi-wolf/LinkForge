


import { serverSettings } from "./config/server";
import { createApp } from "./app/app";
import logger from "./config/logger.config";
import { initializeServices, shutdownServices } from "./app/bootstrap";
import {
  appErrorHandler,
  genericErrorHandler,
} from "./middlewares/error.middleware";

const app = createApp();

/**
 * Add the error handler middleware
 */

app.use(appErrorHandler);
app.use(genericErrorHandler);

const server = app.listen(serverSettings.port, async () => {
  logger.info("Server started successfully", {
    event: "SERVER_START_SUCCESS",
    port: serverSettings.port,
    environment: process.env.NODE_ENV || "development"
  });

  // Set server timeouts
  server.timeout = serverSettings.timeout;
  server.keepAliveTimeout = serverSettings.keepAliveTimeout;
  server.headersTimeout = serverSettings.headersTimeout;

  logger.info("Server timeouts configured", {
    event: "SERVER_TIMEOUTS_CONFIGURED",
    timeout: serverSettings.timeout,
    keepAliveTimeout: serverSettings.keepAliveTimeout,
    headersTimeout: serverSettings.headersTimeout
  });

  try {
    await initializeServices();
    logger.info("All services initialized successfully", {
      event: "SERVICES_INITIALIZATION_SUCCESS"
    });
  } catch (error) {
    logger.error("Failed to initialize services", {
      event: "SERVICES_INITIALIZATION_FAILED",
      err: error instanceof Error ? error : undefined
    });
    process.exit(1);
  }
});

process.on("SIGINT", async () => {
  logger.info("Received SIGINT signal, initiating graceful shutdown", {
    event: "SERVER_SHUTDOWN_SIGINT"
  });
  
  server.close(async () => {
    try {
      await shutdownServices();
      logger.info("Server shutdown completed successfully", {
        event: "SERVER_SHUTDOWN_SUCCESS"
      });
      process.exit(0);
    } catch (error) {
      logger.error("Error during server shutdown", {
        event: "SERVER_SHUTDOWN_ERROR",
        err: error instanceof Error ? error : undefined
      });
      process.exit(1);
    }
  });
});

process.on("SIGTERM", async () => {
  logger.info("Received SIGTERM signal, initiating graceful shutdown", {
    event: "SERVER_SHUTDOWN_SIGTERM"
  });
  
  server.close(async () => {
    try {
      await shutdownServices();
      logger.info("Server shutdown completed successfully", {
        event: "SERVER_SHUTDOWN_SUCCESS"
      });
      process.exit(0);
    } catch (error) {
      logger.error("Error during server shutdown", {
        event: "SERVER_SHUTDOWN_ERROR",
        err: error instanceof Error ? error : undefined
      });
      process.exit(1);
    }
  });
});
