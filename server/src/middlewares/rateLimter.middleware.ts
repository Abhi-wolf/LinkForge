import { rateLimit } from "express-rate-limit";
import { TRPCError } from "@trpc/server";
import { t } from "../routers/trpc/trpc";

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
          return reject(
            new TRPCError({
              code: "TOO_MANY_REQUESTS",
              message: "Rate limit exceeded",
            }),
          );
        }

        if (ctx.res.statusCode === 429) {
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
  limit: 500,
});
export const relaxedRateLimiter = createRateLimitMiddleware({
  windowMs: 60000,
  limit: 50,
});
