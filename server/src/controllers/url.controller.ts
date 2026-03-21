import { z } from "zod";
import { authProcedure, loggedInUserProcedure } from "../routers/trpc/context";
import { UrlService } from "../services/url.service";
import { UrlRepository } from "../repositories/url.repository";
import { CacheRepository } from "../repositories/cache.repository";
import logger from "../config/logger.config";
import type { Request, Response } from "express";
import { UAParser } from "ua-parser-js";
import geoip from "geoip-lite";
import {
  addAnalyticsJob,
  type IAnalyticsJob,
} from "../producers/analytics.producer";
import { AnalyticsService } from "../services/analytics.service";
import { AnalyticsRepository } from "../repositories/analytics.repository";
import { handleAppError } from "../utils/errors/trpc.error";
import { UrlStatus } from "../models/url.model";
import { getCorrelationId } from "../utils/helpers/request.helpers";

const urlService = new UrlService(
  new UrlRepository(),
  new CacheRepository(),
  new AnalyticsRepository(),
);
const analyticsService = new AnalyticsService(
  new AnalyticsRepository(),
  new UrlRepository(),
);

export const urlController = {
  create: authProcedure
    .input(
      z.object({
        originalUrl: z.string().url("Invalid URL"),
        tags: z.array(z.string()).optional(),
        expirationDate: z.coerce.date().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        console.log("urlController create input=", input);

        const url = await urlService.createShortUrl(
          {
            originalUrl: input.originalUrl,
            tags: input.tags,
            expirationDate: input.expirationDate,
          },
          ctx.user?.userId,
        );
        return { url };
      } catch (error) {
        logger.error(`Error creating URL: `, error);
        handleAppError(error);
      }
    }),

  update: loggedInUserProcedure
    .input(
      z.object({
        id: z.string().min(24, "ID is required"),
        originalUrl: z.string().url("Invalid URL").optional(),
        tags: z.array(z.string()).optional(),
        expirationDate: z.coerce.date().optional(),
        status: z.nativeEnum(UrlStatus).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const url = await urlService.updateUrl(
          input.id,
          {
            originalUrl: input?.originalUrl,
            tags: input?.tags,
            expirationDate: input?.expirationDate,
            status: input?.status,
          },
          ctx.user!.userId,
        );
        return { url };
      } catch (error) {
        logger.error(`Error updating URL: `, error);
        handleAppError(error);
      }
    }),

  delete: loggedInUserProcedure
    .input(
      z.object({
        id: z.string().min(24, "ID is required"),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        await urlService.deleteUrl(input.id, ctx.user!.userId);
        return { success: true };
      } catch (error) {
        logger.error(`Error deleting URL: `, error);
        handleAppError(error);
      }
    }),

  getOriginalUrl: loggedInUserProcedure
    .input(
      z.object({
        shortUrl: z.string().min(1, "Short URL is required"),
      }),
    )
    .query(async ({ input }) => {
      try {
        const result = await urlService.getOriginalUrl(input.shortUrl);
        return result;
      } catch (error) {
        logger.error(`Error getting original URL: `, error);
        handleAppError(error);
      }
    }),

  getAllUrlsOfUser: loggedInUserProcedure
    .input(
      z.object({
        search: z.string().optional(),
        status: z.nativeEnum(UrlStatus).optional(),
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
        limit: z.number().int().min(1).optional(),
        offset: z.number().int().min(0).optional(),
      }).optional(),
    )
    .query(async ({ input, ctx }) => {
      try {
        const urls = await urlService.getAllUrlsOfUser(ctx.user!.userId, input || {});
        return urls;
      } catch (error) {
        logger.error(`Error fetching URLs for user : `, error);
        handleAppError(error);
      }
    }),
};

export async function redirectUrl(req: Request, res: Response) {
  const userAgent = req.headers["user-agent"] || "Unknown";
  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  let ip =
    (req.headers["x-forwarded-for"] as string) ||
    req.socket.remoteAddress ||
    req.ip ||
    "";

  if (ip === "::1") ip = "127.0.0.1";

  const geo = geoip.lookup(ip);

  // console.log("Parsed User Agent = ", result);
  // console.log("LOCATION DETAILS = ", ip, geo);

  const location = {
    country: geo?.country || "unknown",
    region: geo?.region || "unknown",
    city: geo?.city || "unknown",
    timezone: geo?.timezone || "unknown",
  };

  const { shortUrl } = req.params;

  const url = await urlService.getOriginalUrl(shortUrl);

  if (!url) {
    res.status(404).json({
      success: false,
      message: "URL not found",
    });
    return;
  }

  const utmSource = (req.query.utm_source as string) || "unknown";

  const ref =
    (req.query.ref as string) ||
    (req.headers.referer as string) ||
    (req.headers.referrer as string) ||
    "direct";

  const analyticsData: IAnalyticsJob = {
    urlId: url.urlId,
    shortUrl: shortUrl,
    utmSource,
    ref,
    os: result.os.name || "Linux",
    browser: result.browser.name || "Chrome",
    device: result.device.type || "desktop",
    utcDate: new Date().toISOString(),
    correlationId: getCorrelationId(),
    ...location,
  };

  await addAnalyticsJob(analyticsData);

  //302 → Temporary redirect (browser re-checks every time) — good for tracking analytics
  res.redirect(url.originalUrl);
}

export async function getAnalyticsForUrlId(req: Request, res: Response) {
  const { urlId } = req.params;
  const { startDate, endDate, timezone } = req.query;

  // console.log(
  //   "URL ID : ",
  //   urlId,
  //   " START DATE : ",
  //   startDate,
  //   " END DATE : ",
  //   endDate,
  //   " TIMEZONE : ",
  //   timezone,
  // );

  if (
    typeof startDate !== "string" ||
    typeof endDate !== "string" ||
    typeof timezone !== "string"
  ) {
    res.status(400).json({
      success: false,
      message: "Date and timezone are required",
    });
    return;
  }

  const analytics = await analyticsService.getAggregatedAnalyticsForDate(
    urlId,
    startDate,
    endDate,
    timezone,
  );

  res.status(200).json({
    success: true,
    data: analytics,
  });
}
