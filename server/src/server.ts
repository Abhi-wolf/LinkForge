import express, { Request, Response } from "express";
import { serverConfig } from "./config";
import v1Router from "./routers/v1/index.router";
import v2Router from "./routers/v2/index.router";
import {
  appErrorHandler,
  genericErrorHandler,
} from "./middlewares/error.middleware";
import logger from "./config/logger.config";
import { attachCorrelationIdMiddleware } from "./middlewares/correlation.middleware";
import { checkRedis, closeRedis, initRedis } from "./config/redis";
import { checkMongo, connectDB, disconnectDB } from "./config/db";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { trpcRouter } from "./routers/trpc";
import {
  getAnalyticsForUrlId,
  redirectUrl,
} from "./controllers/url.controller";
import { createContext } from "./routers/trpc/trpc";
import { startAnalyticsWorker } from "./workers/analytics.worker";
import { aggregationAnalyticsQueue } from "./queues/analytics.aggregation.queue";
import { startAggregationAnalyticsWorker } from "./workers/analytics.aggregation.worker";
import { startMcpServer } from "./mcp.server";
import cors from "cors"

const app = express();

app.use(express.json());

app.use(cors());

/**
 * Registering all the routers and their corresponding routes with out app server object.
 */

app.use(attachCorrelationIdMiddleware);

app.use(
  "/trpc",
  createExpressMiddleware({
    router: trpcRouter,
    createContext,
  }),
);

app.use("/api/v1", v1Router);
app.use("/api/v2", v2Router);

app.get("/health", async (req: Request, res: Response) => {
  try {
    const isRedisRunning = await checkRedis();
    const isMongoRunning = await checkMongo();

    if (!isRedisRunning || !isMongoRunning) {
      res.status(503).json({
        success: false,
        error: "Dependency failure",
      });

      return;
    }

    res.status(200).json({
      success: true,
      message: "Server is running",
      uptime: process.uptime(),
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: "Dependency failure",
    });
  }
});

app.get("/:shortUrl", redirectUrl);
app.get("/analytics/:urlId", getAnalyticsForUrlId);

/**
 * Add the error handler middleware
 */

app.use(appErrorHandler);
app.use(genericErrorHandler);

app.listen(serverConfig.PORT, async () => {
  logger.info(`Server is running on http://localhost:${serverConfig.PORT}`);
  logger.info(`Press Ctrl+C to stop the server.`);

  await initRedis();
  await connectDB();
  await startAnalyticsWorker();
  await startAggregationAnalyticsWorker();
  await startMcpServer();

  await aggregationAnalyticsQueue.upsertJobScheduler(
    "aggregate-hourly-analytics",
    {
      pattern: "0 * * * *", // every hour at minute 0
    },
    {
      name: "aggregate-hourly-analytics",
      data: {},
      opts: {
        removeOnComplete: true,
        removeOnFail: 1000,
      },
    },
  );
});

process.on("SIGINT", async () => {
  await closeRedis();
  await disconnectDB();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await closeRedis();
  await disconnectDB();
  process.exit(0);
});
