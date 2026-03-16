// import { initTRPC } from "@trpc/server";
// import { CreateExpressContextOptions } from "@trpc/server/dist/adapters/express.cjs";
import {
  normalRateLimiter,
  relaxedRateLimiter,
  strictRateLimiter,
} from "../../middlewares/rateLimter.middleware";

// export const createContext = ({ req, res }: CreateExpressContextOptions) => ({
//   req,
//   res,
// });

// export type Context = Awaited<ReturnType<typeof createContext>>;

// export const t = initTRPC.context<Context>().create();

// export const router = t.router;
// export const authProcedure = t.procedure.use(strictRateLimiter);
// export const loggedInUserProcedure = t.procedure.use(normalRateLimiter);
// export const publicProcedure = t.procedure.use(relaxedRateLimiter);

import { t } from "./trpc";

export const router = t.router;
export const authProcedure = t.procedure.use(strictRateLimiter);
export const loggedInUserProcedure = t.procedure.use(normalRateLimiter);
export const publicProcedure = t.procedure.use(relaxedRateLimiter);
