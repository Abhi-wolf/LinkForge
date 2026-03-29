import { initTRPC } from "@trpc/server";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { createContextLogger } from "../../config/logger.config";

const trpcLogger = createContextLogger("system", "trpc");

export const createContext = ({ req, res }: CreateExpressContextOptions) => ({
  req,
  res,
  user: null as { userId: string, tokenVersion: number } | null
});

export type Context = Awaited<ReturnType<typeof createContext>>;

export const t = initTRPC.context<Context>().create();

/**
 * Middleware for logging tRPC procedures
 */
export const loggingMiddleware = t.middleware(async ({ path, type, next, input, ctx }) => {
  const start = Date.now();
  
  // Log procedure start
  trpcLogger.info("procedureStarted", `tRPC ${type} started: ${path}`, {
    path,
    type,
    // Sanitize input if needed (e.g., remove passwords)
    input: input && typeof input === 'object' ? { ...input, password: undefined } : input,
  });

  const result = await next();
  const durationMs = Date.now() - start;

  if (result.ok) {
    trpcLogger.info("procedureFinished", `tRPC ${type} finished: ${path} - ${durationMs}ms`, {
      path,
      type,
      durationMs,
    });
  } else {
    trpcLogger.error("procedureFailed", `tRPC ${type} failed: ${path} - ${durationMs}ms`, {
      path,
      type,
      durationMs,
      error: result.error,
    });
  }

  return result;
});

// Export a base procedure that includes the logging middleware
export const publicProcedure = t.procedure.use(loggingMiddleware);
