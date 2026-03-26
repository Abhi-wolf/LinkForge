import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { UrlFactory } from "../../factories/url.factory";
import { withMcpErrorHandling } from "../utils/mcp.error";
import { AnalyticsFactory } from "../../factories/analytics.factory";
import logger from "../../config/logger.config";

const urlService = UrlFactory.getUrlService();
const analyticsService = AnalyticsFactory.getAnalyticsService();

export function registerUrlShortenerTools(server: McpServer, userId: string) {
  server.registerTool(
    "create_short_url",
    {
      description: "Creates a short URL",
      inputSchema: {
        originalUrl: z
          .string()
          .describe("The original URL to be shortened")
          .max(2048, "URL too long (max 2048 characters)"),
        tags: z
          .array(z.string())
          .max(3, "Tags too long (max 3 tags)")
          .optional(),
        expirationDate: z.coerce.date().optional(),
      },
    },

    withMcpErrorHandling(
      async (args: {
        originalUrl: string;
        tags?: string[];
        expirationDate?: Date;
      }) => {
        logger.info("create_short_url tool invoked", {
          userId,
          originalUrl: args.originalUrl,
        });

        const result = await urlService.createShortUrl(
          {
            originalUrl: args.originalUrl,
            tags: args.tags,
            expirationDate: args.expirationDate,
          },
          userId,
        );

        logger.info("short url created successfully", {
          userId,
          shortUrl: result.shortUrl,
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result),
            },
          ],
        };
      },
    ),
  );

  server.registerTool(
    "get_original_url",
    {
      description: "Retrieves the original URL from a short URL ID",
      inputSchema: {
        shortUrl: z
          .string()
          .describe("The short URL ID")
          .min(1, "Short URL is required")
          .max(10, "Short URL is invalid"),
      },
    },

    withMcpErrorHandling(async (args: { shortUrl: string }) => {
      logger.info("get_original_url tool invoked", {
        userId,
        originalUrl: args.shortUrl,
      });

      const result = await urlService.getOriginalUrl(args.shortUrl);

      logger.info("original url fetched successfully", {
        userId,
        originalUrl: args.shortUrl,
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result),
          },
        ],
      };
    }),
  );

  server.registerTool(
    "get_analytics_info_about_a_url",
    {
      description: "Retrieves analytics info about a short url",
      inputSchema: {
        shortUrl: z
          .string()
          .describe("The short URL is required")
          .min(1, "Short URL is required")
          .max(10, "Short URL is invalid"),
        startDate: z.coerce
          .date()
          .describe("Date from which the analytics you want"),
        endDate: z.coerce
          .date()
          .describe("Date upto which the analytics you want"),
      },
    },

    withMcpErrorHandling(
      async (args: { shortUrl: string; startDate: Date; endDate: Date }) => {
        logger.info("get_analytics_info_about_a_url tool invoked", {
          userId,
          shortUrl: args.shortUrl,
          startDate: args.startDate,
          endDate: args.endDate,
        });

        const urlInfo = await urlService.getUrlBelongsToUser(
          args.shortUrl,
          userId,
        );

        const result = await analyticsService.getAnalyticsForUrlId(
          urlInfo.urlId,
          args.startDate,
          args.endDate,
        );

        logger.info("analytics info fetched successfully", {
          userId,
          shortUrl: args.shortUrl,
          startDate: args.startDate,
          endDate: args.endDate,
        });
        return { content: [{ type: "text", text: JSON.stringify(result) }] };
      },
    ),
  );

  server.registerTool(
    "get_all_user_urls",
    {
      description: "Retrieves all urls created by a user",
    },

    withMcpErrorHandling(async () => {
      logger.info("get_all_user_urls tool invoked", {
        userId,
      });

      const result = await urlService.getAllUrlsOfUser(userId, {});

      logger.info("get_all_user_urls fetched successfully ", {
        userId,
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result),
          },
        ],
      };
    }),
  );
}
