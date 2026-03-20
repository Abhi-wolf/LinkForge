import { z } from "zod";
import {
  loggedInUserProcedure,
  publicProcedure,
} from "../routers/trpc/context";
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
  getAnalytics: publicProcedure
    .input(
      z.object({
        urlId: z.string().min(24, "URL ID is required"),
        startDate: z.coerce.date(), // ✅ converts ISO string → Date
        endDate: z.coerce.date(), // ✅ converts ISO string → Date
      }),
    )
    .query(async ({ input }) => {
      try {
        const result = await analyticsService.getAnalyticsForUrlId(
          input.urlId,
          input.startDate,
          input.endDate,
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
