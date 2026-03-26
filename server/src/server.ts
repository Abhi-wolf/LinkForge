import { createApp } from "./app/app";
import { serverSettings } from "./config/server";
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
  logger.info(`Server is running on http://localhost:${serverSettings.port}`);
  logger.info(`Press Ctrl+C to stop the server.`);

  // Set server timeouts
  server.timeout = serverSettings.timeout;
  server.keepAliveTimeout = serverSettings.keepAliveTimeout;
  server.headersTimeout = serverSettings.headersTimeout;

  await initializeServices();
});

process.on("SIGINT", async () => {
  logger.info("Received SIGINT, shutting down gracefully...");
  server.close(async () => {
    await shutdownServices();
    process.exit(0);
  });
});

process.on("SIGTERM", async () => {
  logger.info("Received SIGTERM, shutting down gracefully...");
  server.close(async () => {
    await shutdownServices();
    process.exit(0);
  });
});
