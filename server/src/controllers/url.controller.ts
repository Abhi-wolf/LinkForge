import { z } from "zod";
import { authProcedure, loggedInUserProcedure } from "../routers/trpc/context";
import { createContextLogger } from "../config/logger.config";
import type { Request, Response } from "express";
import { UAParser } from "ua-parser-js";
import geoip from "geoip-lite";
import {
  addAnalyticsJob,
  type IAnalyticsJob,
} from "../producers/analytics.producer";
import { handleAppError } from "../utils/errors/trpc.error";
import { UrlStatus } from "../models/url.model";
import { getCorrelationId } from "../utils/helpers/request.helpers";
import { UrlFactory } from "../factories/url.factory";

const urlLogger = createContextLogger("url", "controller");
const urlService = UrlFactory.getUrlService();

export const urlController = {
  create: authProcedure
    .input(
      z.object({
        originalUrl: z
          .string()
          .url("Invalid URL")
          .max(2048, "URL too long (max 2048 characters)"),
        tags: z
          .array(z.string())
          .max(3, "Tags too long (max 3 tags)")
          .optional(),
        expirationDate: z.coerce.date().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        urlLogger.info("create", "Short URL creation attempt started", {
          userId: ctx.user?.userId,
          originalUrl: input.originalUrl,
        });
        const url = await urlService.createShortUrl(
          {
            originalUrl: input.originalUrl,
            tags: input.tags,
            expirationDate: input.expirationDate,
          },
          ctx.user?.userId,
        );
        urlLogger.info("create", "Short URL created successfully", {
          userId: ctx.user?.userId,
          shortUrl: url.shortUrl,
        });
        return { url };
      } catch (error) {
        urlLogger.warn("create", "Short URL creation failed", {
          userId: ctx.user?.userId,
          originalUrl: input.originalUrl,
          err: error instanceof Error ? error : undefined,
        });
        handleAppError(error);
      }
    }),

  update: loggedInUserProcedure
    .input(
      z.object({
        id: z.string().min(24, "ID is required"),
        originalUrl: z
          .string()
          .url("Invalid URL")
          .max(2048, "URL too long (max 2048 characters)")
          .optional(),
        tags: z
          .array(z.string())
          .max(3, "Tags too long (max 3 tags)")
          .optional(),
        expirationDate: z.coerce.date().optional(),
        status: z.nativeEnum(UrlStatus).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        urlLogger.info("update", "URL update attempt started", {
          userId: ctx.user!.userId,
          urlId: input.id,
        });
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
        urlLogger.info("update", "URL updated successfully", {
          userId: ctx.user!.userId,
          urlId: input.id,
        });
        return { url };
      } catch (error) {
        urlLogger.warn("update", "URL update failed", {
          userId: ctx.user!.userId,
          urlId: input.id,
          err: error instanceof Error ? error : undefined,
        });
        handleAppError(error);
      }
    }),

  delete: loggedInUserProcedure
    .input(
      z.object({
        id: z.string().min(24, "ID is required").max(24, "ID is invalid"),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        urlLogger.info("delete", "URL deletion attempt started", {
          userId: ctx.user!.userId,
          urlId: input.id,
        });
        await urlService.deleteUrl(input.id, ctx.user!.userId);
        urlLogger.info("delete", "URL deleted successfully", {
          userId: ctx.user!.userId,
          urlId: input.id,
        });
        return { success: true };
      } catch (error) {
        urlLogger.warn("delete", "URL deletion failed", {
          userId: ctx.user!.userId,
          urlId: input.id,
          err: error instanceof Error ? error : undefined,
        });
        handleAppError(error);
      }
    }),

  getOriginalUrl: loggedInUserProcedure
    .input(
      z.object({
        shortUrl: z
          .string()
          .min(1, "Short URL is required")
          .max(10, "Short URL is invalid"), // TODO: check the max-length
      }),
    )
    .query(async ({ input }) => {
      try {
        urlLogger.info("getOriginalUrl", "Original URL lookup started", {
          shortUrl: input.shortUrl,
        });
        const result = await urlService.getOriginalUrl(input.shortUrl);
        urlLogger.info("getOriginalUrl", "Original URL lookup successful", {
          shortUrl: input.shortUrl,
        });
        return result;
      } catch (error) {
        urlLogger.warn("getOriginalUrl", "Original URL lookup failed", {
          shortUrl: input.shortUrl,
          err: error instanceof Error ? error : undefined,
        });
        handleAppError(error);
      }
    }),

  getAllUrlsOfUser: loggedInUserProcedure
    .input(
      z
        .object({
          search: z.string().max(100, "Search is too long").optional(),
          status: z.nativeEnum(UrlStatus).optional(),
          startDate: z.coerce.date().optional(),
          endDate: z.coerce.date().optional(),
          limit: z.number().int().min(1).max(100).optional(),
          offset: z.number().int().min(0).optional(),
        })
        .optional(),
    )
    .query(async ({ input, ctx }) => {
      try {
        urlLogger.info("getAllUrlsOfUser", "Fetching all URLs for user", {
          userId: ctx.user!.userId,
        });
        const urls = await urlService.getAllUrlsOfUser(
          ctx.user!.userId,
          input || {},
        );
        urlLogger.info("getAllUrlsOfUser", "URLs fetched successfully", {
          userId: ctx.user!.userId,
          count: urls.urls.length,
        });
        return urls;
      } catch (error) {
        urlLogger.error("getAllUrlsOfUser", "Failed to fetch user URLs", {
          userId: ctx.user!.userId,
          err: error instanceof Error ? error : undefined,
        });
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

  const location = {
    country: geo?.country || "unknown",
    region: geo?.region || "unknown",
    city: geo?.city || "unknown",
    timezone: geo?.timezone || "unknown",
  };

  const { shortUrl } = req.params;

  const url = await urlService.getOriginalUrl(shortUrl);

  if (!url) {
    urlLogger.warn("redirectUrl", "URL not found for redirection", {
      shortUrl,
    });
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
    // urlId: url.urlId,
    urlId: "jdfhsk",
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

  //302 → Temporary redirect (browser re-checks every time) — good for tracking analytics
  res.redirect(url.originalUrl);

  addAnalyticsJob(analyticsData);
}
