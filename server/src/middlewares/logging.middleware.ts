import { Request, Response, NextFunction } from "express";
import { createContextLogger } from "../config/logger.config";
import {
  httpErrorsTotal,
  httpRequestDuration,
  httpRequestsTotal,
} from "../metrics/http.metrics";

const httpLogger = createContextLogger("system", "http");

export const loggingMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const startTime = Date.now();
  const { method, url } = req;

  // Skip logging for tRPC routes - let tRPC handle it
  if (req.path.startsWith("/trpc")) {
    return next();
  }

  // Log request start
  httpLogger.info("request", `Request started: ${method} ${url}`, {
    method,
    url,
  });

  // Intercept response finish
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    const { statusCode } = res;

    // Convert duration to seconds for Prometheus
    const durationInSeconds = duration / 1000;

    // Get route name (fallback to URL path)
    const route = req.route?.path || url.split("?")[0];

    httpRequestsTotal.inc({
      method,
      route,
      status_code: statusCode.toString(),
    });

    httpRequestDuration.observe(
      {
        method,
        route,
        status_code: statusCode.toString(),
      },
      durationInSeconds,
    );

    // console.log("httpRequestsTotal", httpRequestsTotal);
    // console.log("httpRequestDuration", httpRequestDuration);
    // console.log("httpErrorsTotal", httpErrorsTotal);

    // track errors (4xx and 5xx)
    if (statusCode >= 400) {
      httpErrorsTotal.inc({
        method,
        route,
        status_code: statusCode.toString(),
      });
    }

    httpLogger.info(
      "response",
      `Request finished: ${method} ${url} ${statusCode} - ${duration}ms`,
      {
        method,
        url,
        statusCode,
        durationInSeconds,
      },
    );
  });

  next();
};
