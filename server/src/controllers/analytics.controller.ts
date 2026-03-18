import { z } from "zod";
import { loggedInUserProcedure } from "../routers/trpc/context";
import logger from "../config/logger.config";
import { AnalyticsService } from "../services/analytics.service";
import { AnalyticsRepository } from "../repositories/analytics.repository";
import { UrlRepository } from "../repositories/url.repository";
import { handleAppError } from "../utils/errors/trpc.error";

const analyticsService = new AnalyticsService(
  new AnalyticsRepository(),
  new UrlRepository(),
);

export const analyticsController = {
  getAnalytics: loggedInUserProcedure
    .input(
      z.object({
        urlId: z.string().min(1, "URL ID is required"),
        startDate: z.string().min(1, "Start date is required"),
        endDate: z.string().min(1, "End date is required"),
        timezone: z.string().min(1, "Timezone is required"),
      }),
    )
    .query(async ({ input }) => {
      try {
        const result = await analyticsService.getAggregatedAnalyticsForDate(
          input.urlId,
          input.startDate,
          input.endDate,
          input.timezone,
        );
        return result;
      } catch (error) {
        logger.error(`Error getting analytics URL: ${error}`);
        handleAppError(error);
      }
    }),

  getDashboardAnalytics: loggedInUserProcedure.query(async ({ ctx }) => {
    try {
      const result = await analyticsService.getUserAnalytics(ctx.user!.userId);
      return result;
    } catch (error) {
      logger.error(`Error getting dashboard analytics: ${error}`);
      handleAppError(error);
    }
  }),
};
