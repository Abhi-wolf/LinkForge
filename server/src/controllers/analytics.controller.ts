import { z } from "zod";
import {
  loggedInUserProcedure,
} from "../routers/trpc/context";
import { createContextLogger } from "../config/logger.config";
import { handleAppError } from "../utils/errors/trpc.error";
import { AnalyticsFactory } from "../factories/analytics.factory";

const analyticsLogger = createContextLogger("analytics", "controller");
const analyticsService = AnalyticsFactory.getAnalyticsService();

export const analyticsController = {
  getAnalytics: loggedInUserProcedure
    .input(
      z.object({
        urlId: z
          .string()
          .min(24, "URL ID is required")
          .max(24, "URL ID is invalid"),
        startDate: z.coerce.date(), // ✅ converts ISO string → Date
        endDate: z.coerce.date(), // ✅ converts ISO string → Date
      }),
    )
    .query(async ({ input, ctx }) => {
      try {
        analyticsLogger.info("getAnalytics", "Fetching URL analytics", {
          urlId: input.urlId,
          startDate: input.startDate,
          endDate: input.endDate
        });
        const result = await analyticsService.getAnalyticsForUrlId(
          ctx.user!.userId,
          input.urlId,
          input.startDate,
          input.endDate,
        );
        analyticsLogger.info("getAnalytics", "URL analytics fetched successfully", {
          urlId: input.urlId
        });
        return result;
      } catch (error) {
        analyticsLogger.warn("getAnalytics", "URL analytics fetch failed", {
          urlId: input.urlId,
          err: error instanceof Error ? error : undefined
        });
        handleAppError(error);
      }
    }),

  getDashboardAnalytics: loggedInUserProcedure.query(async ({ ctx }) => {
    try {
      analyticsLogger.info("getDashboardAnalytics", "Fetching dashboard analytics", { userId: ctx.user!.userId });
      const result = await analyticsService.getUserAnalytics(ctx.user!.userId);
      analyticsLogger.info("getDashboardAnalytics", "Dashboard analytics fetched successfully", {
        userId: ctx.user!.userId
      });
      return result;
    } catch (error) {
      analyticsLogger.error("getDashboardAnalytics", "Failed to fetch dashboard analytics", {
        userId: ctx.user!.userId,
        err: error instanceof Error ? error : undefined
      });
      handleAppError(error);
    }
  }),
};
