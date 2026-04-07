import express, { Application } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { attachCorrelationIdMiddleware } from "../middlewares/correlation.middleware";
import { loggingMiddleware } from "../middlewares/logging.middleware";
import { setupRoutes } from "./routes";
import { setupHealthChecks } from "./health";
import { env } from "../config/env";

export function createApp(): Application {
  const app = express();

  // Custom middleware for correlation ID (Must be first for logging)
  app.use(attachCorrelationIdMiddleware);

  // Structured logging middleware
  app.use(loggingMiddleware);

  // Security middleware
  app.use(helmet());

  // Body parsing middleware
  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());

  // CORS configuration
  const allowedOrigins = env.CORS_ORIGINS?.split(",");

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins?.includes(origin)) {
          return callback(null, true);
        }

        return callback(new Error("Not allowed by CORS"), false);
      },
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    }),
  );

  // Setup routes
  setupRoutes(app);

  // Setup health checks
  setupHealthChecks(app);

  return app;
}
