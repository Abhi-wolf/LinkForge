import express, { Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';

import { serverConfig } from "./config";
import v1Router from "./routers/v1/index.router";
import v2Router from "./routers/v2/index.router";
import logger from "./config/logger.config";
import { attachCorrelationIdMiddleware } from "./middlewares/correlation.middleware";
import { checkRedis, closeRedis, initRedis } from "./config/redis";
import { checkMongo, connectDB, disconnectDB } from "./config/db";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { trpcRouter } from "./routers/trpc";
import { createContext } from "./routers/trpc/trpc";
import { startAnalyticsWorker } from "./workers/analytics.worker";
import { startAnalyticsAggregationScheduler } from "./queues/analytics.aggregation.scheduler";
import { startUrlExpiryWorker } from "./workers/url.expiry.worker";
import { startUrlExpirySchedulaer } from "./queues/url.expiry.scheduler";
import { startAggregationAnalyticsWorker } from "./workers/analytics.aggregation.worker";
import { redirectUrl } from "./controllers/url.controller";
import { analyticsDeadLetterQueue, analyticsQueue } from "./queues/analytics.queue";
import {
  appErrorHandler,
  genericErrorHandler,
} from "./middlewares/error.middleware";
import { startMcpServer } from "./mcp.server";

const app = express();

app.use(express.json());

app.use(cookieParser());

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"], // e.g., http://localhost:5173
    credentials: true,
  }),
);

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

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/ui');

createBullBoard({
  queues: [new BullMQAdapter(analyticsQueue), new BullMQAdapter(analyticsDeadLetterQueue)],
  serverAdapter,
});

app.use('/ui', serverAdapter.getRouter());


app.get("/:shortUrl", redirectUrl);

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

  await startAnalyticsAggregationScheduler();
  await startAggregationAnalyticsWorker();

  await startUrlExpirySchedulaer();
  await startUrlExpiryWorker();

  await startMcpServer();
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
