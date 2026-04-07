import { rateLimit } from "express-rate-limit";
import { TRPCError } from "@trpc/server";
import { t } from "../routers/trpc/trpc";
import logger from "../config/logger.config";
import { rateLimitExceededTotal } from "../metrics/http.metrics";

export function createRateLimitMiddleware(
  options: Parameters<typeof rateLimit>[0],
) {
  const limiter = rateLimit({
    standardHeaders: true,
    validate: { singleCount: false },
    ...options,
  });

  return t.middleware(async ({ ctx, next }) => {
    await new Promise<void>((resolve, reject) => {
      limiter(ctx.req, ctx.res, (err) => {
        if (err) {
          logger.warn("Rate limit exceeded - request rejected", {
            event: "RATE_LIMIT_EXCEEDED",
          });

          rateLimitExceededTotal.inc({ ip: ctx.req.ip });

          return reject(
            new TRPCError({
              code: "TOO_MANY_REQUESTS",
              message: "Rate limit exceeded",
            }),
          );
        }

        if (ctx.res.statusCode === 429) {
          logger.warn("Rate limit exceeded - response status 429", {
            event: "RATE_LIMIT_EXCEEDED",
          });

          rateLimitExceededTotal.inc({ ip: ctx.req.ip });

          return reject(
            new TRPCError({
              code: "TOO_MANY_REQUESTS",
              message: "Rate limit exceeded",
            }),
          );
        }

        resolve();
      });
    });

    return next({ ctx });
  });
}

export const strictRateLimiter = createRateLimitMiddleware({
  windowMs: 60000,
  limit: 40,
});
export const normalRateLimiter = createRateLimitMiddleware({
  windowMs: 60000,
  limit: 60,
});
export const relaxedRateLimiter = createRateLimitMiddleware({
  windowMs: 60000,
  limit: 100,
});
