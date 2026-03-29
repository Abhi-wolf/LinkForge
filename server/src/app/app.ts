import express, { Application } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { attachCorrelationIdMiddleware } from "../middlewares/correlation.middleware";
import { loggingMiddleware } from "../middlewares/logging.middleware";
import { setupRoutes } from "./routes";
import { setupHealthChecks } from "./health";

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
  app.use(
    cors({
      origin: [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
      ],
      credentials: true,
    }),
  );

  // Setup routes
  setupRoutes(app);

  // Setup health checks
  setupHealthChecks(app);

  return app;
}
