import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { UrlFactory } from "../../factories/url.factory";
import { withMcpErrorHandling } from "../utils/mcp.error";
import { AnalyticsFactory } from "../../factories/analytics.factory";

const urlService = UrlFactory.getUrlService();
const analyticsService = AnalyticsFactory.getAnalyticsService();

export function registerUrlShortenerTools(server: McpServer, userId: string) {
  server.registerTool(
    "create_short_url",
    {
      description: "Creates a short URL",
      inputSchema: {
        originalUrl: z.string().describe("The original URL to be shortened"),
        tags: z.array(z.string()).optional(),
        expirationDate: z.coerce.date().optional(),
      },
    },
    // async (args: {
    //   originalUrl: string;
    //   tags?: string[];
    //   expirationDate?: Date;
    // }) => {
    //   const result = await urlService.createShortUrl({
    //     originalUrl: args.originalUrl,
    //     tags: args.tags,
    //     expirationDate: args.expirationDate,
    //   },userId);

    //   return {
    //     content: [
    //       {
    //         type: "text",
    //         text: JSON.stringify(result),
    //       },
    //     ],
    //   };
    // },

    withMcpErrorHandling(
      async (args: {
        originalUrl: string;
        tags?: string[];
        expirationDate?: Date;
      }) => {
        const result = await urlService.createShortUrl(
          {
            originalUrl: args.originalUrl,
            tags: args.tags,
            expirationDate: args.expirationDate,
          },
          userId,
        );

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
        shortUrl: z.string().describe("The short URL ID"),
      },
    },
    // async (args: { shortUrl: string }) => {
    //   const result = await urlService.getOriginalUrl(args.shortUrl);

    //   return {
    //     content: [
    //       {
    //         type: "text",
    //         text: JSON.stringify(result),
    //       },
    //     ],
    //   };
    // },

    withMcpErrorHandling(async (args: { shortUrl: string }) => {
      const result = await urlService.getOriginalUrl(args.shortUrl);

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
        shortUrl: z.string().describe("The short URL ID"),
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
        const urlInfo = await urlService.getUrlBelongsToUser(
          args.shortUrl,
          userId,
        );
        const result = await analyticsService.getAnalyticsForUrlId(
          urlInfo.urlId,
          args.startDate,
          args.endDate,
        );
        return { content: [{ type: "text", text: JSON.stringify(result) }] };
      },
    ),
  );

  server.registerTool(
    "get_all_user_urls",
    {
      description: "Retrieves all urls created by a user",
    },
    // async () => {
    //   const result = await urlService.getAllUrlsOfUser(userId, {});

    //   return {
    //     content: [
    //       {
    //         type: "text",
    //         text: JSON.stringify(result),
    //       },
    //     ],
    //   };
    // },

    withMcpErrorHandling(async () => {
      const result = await urlService.getAllUrlsOfUser(userId, {});

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
