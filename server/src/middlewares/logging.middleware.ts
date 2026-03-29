import { Request, Response, NextFunction } from "express";
import { createContextLogger } from "../config/logger.config";

const httpLogger = createContextLogger("system", "http");

export const loggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const { method, url } = req;

  // Log request start
  httpLogger.info("request", `Request started: ${method} ${url}`, {
    method,
    url,
  });

  // Intercept response finish
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    const { statusCode } = res;

    httpLogger.info("response", `Request finished: ${method} ${url} ${statusCode} - ${duration}ms`, {
      method,
      url,
      statusCode,
      duration,
    });
  });

  next();
};
