import {
  attachUserIfPresent,
  isAuthenticated,
} from "../../middlewares/auth.middleware";
import {
  normalRateLimiter,
  relaxedRateLimiter,
  strictRateLimiter,
} from "../../middlewares/rateLimter.middleware";

import { t } from "./trpc";

export const router = t.router;
export const publicProcedure = t.procedure.use(relaxedRateLimiter);
export const authProcedure = t.procedure
  .use(strictRateLimiter)
  .use(attachUserIfPresent());
export const loggedInUserProcedure = t.procedure
  .use(normalRateLimiter)
  .use(isAuthenticated());
