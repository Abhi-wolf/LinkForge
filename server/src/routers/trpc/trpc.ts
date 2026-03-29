import { initTRPC } from "@trpc/server";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { createContextLogger } from "../../config/logger.config";

const trpcLogger = createContextLogger("system", "trpc");

export const createContext = ({ req, res }: CreateExpressContextOptions) => ({
  req,
  res,
  user: null as { userId: string; tokenVersion: number } | null,
});

export type Context = Awaited<ReturnType<typeof createContext>>;

export const t = initTRPC.context<Context>().create();

/**
 * Middleware for logging tRPC procedures
 */

export const loggingMiddleware = t.middleware(
  async ({ path, type, next, input, ctx }) => {
    const start = Date.now();

    trpcLogger.info("procedureStarted", `tRPC ${type} started: ${path}`, {
      path,
      type,
      input:
        input && typeof input === "object"
          ? { ...input, password: undefined }
          : input,
    });

    try {
      const result = await next();

      const durationMs = Date.now() - start;

      trpcLogger.info(
        "procedureFinished",
        `tRPC ${type} finished: ${path} - ${durationMs}ms`,
        {
          path,
          type,
          durationMs,
        },
      );

      return result;
    } catch (error: any) {
      const durationMs = Date.now() - start;

      trpcLogger.error(
        "procedureFailed",
        `tRPC ${type} failed: ${path} - ${durationMs}ms`,
        {
          path,
          type,
          durationMs,
          error: error?.message || "Unknown error",
          code: error?.code,
        },
      );

      throw error;
    }
  },
);

export const publicProcedure = t.procedure.use(loggingMiddleware);
