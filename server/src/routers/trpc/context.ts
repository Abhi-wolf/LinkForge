import {
  attachUserIfPresent,
  isAuthenticated,
} from "../../middlewares/auth.middleware";
import {
  normalRateLimiter,
  relaxedRateLimiter,
  strictRateLimiter,
} from "../../middlewares/rateLimter.middleware";

import { t, loggingMiddleware } from "./trpc";

export const router = t.router;
export const publicProcedure = t.procedure
  .use(loggingMiddleware)
  .use(relaxedRateLimiter);
export const authProcedure = t.procedure
  .use(loggingMiddleware)
  .use(strictRateLimiter)
  .use(attachUserIfPresent());
export const loggedInUserProcedure = t.procedure
  .use(loggingMiddleware)
  .use(normalRateLimiter)
  .use(isAuthenticated());
