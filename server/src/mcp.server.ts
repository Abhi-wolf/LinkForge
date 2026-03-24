import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";
import cors from "cors";
import logger from "./config/logger.config";
import { apiKeyMiddleware } from "./middlewares/apikey.middleware";
import { AppError } from "./utils/errors/app.error";
import { UrlFactory } from "./factories/url.factory";
import { AnalyticsFactory } from "./factories/analytics.factory";

export function toMcpError(error: unknown) {
  const message =
    error instanceof AppError
      ? `${error.name}: ${error.message}`
      : error instanceof Error
      ? error.message
      : "An unexpected error occurred";

  return {
    content: [{ type: "text" as const, text: message }],
    isError: true,
  };
}

const urlService = UrlFactory.getUrlService();

const analyticsService = AnalyticsFactory.getAnalyticsService();

function registerTools(server: McpServer, userId: string) {
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
    async (args: {
      originalUrl: string;
      tags?: string[];
      expirationDate?: Date;
    }) => {
      const result = await urlService.createShortUrl({
        originalUrl: args.originalUrl,
        tags: args.tags,
        expirationDate: args.expirationDate,
      },userId);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result),
          },
        ],
      };
    },
  );

  server.registerTool(
    "get_original_url",
    {
      description: "Retrieves the original URL from a short URL ID",
      inputSchema: {
        shortUrl: z.string().describe("The short URL ID"),
      },
    },
    async (args: { shortUrl: string }) => {
      const result = await urlService.getOriginalUrl(args.shortUrl);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result),
          },
        ],
      };
    },
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


    async (args: { shortUrl: string; startDate: Date; endDate: Date }) => {
      // console.log("get_analytics_info_about_a_url = ",args);

      // const urlInfo = await urlService.getUrlBelongsToUser(args.shortUrl, userId);

      // console.log("urlInfo = ",urlInfo);

      // if (!urlInfo) {
      //   throw new NotFoundError("URL not found");
      // }

      // const result = await analyticsService.getAnalyticsForUrlId(
      //   urlInfo.urlId,
      //   args.startDate,
      //   args.endDate,
      // );

      // console.log("result = ",result);

      // return {
      //   content: [
      //     {
      //       type: "text",
      //       text: JSON.stringify(result),
      //     },
      //   ],
      // };

      try {
      const urlInfo = await urlService.getUrlBelongsToUser(args.shortUrl, userId);
      const result = await analyticsService.getAnalyticsForUrlId(
        urlInfo.urlId,
        args.startDate,
        args.endDate,
      );
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    } catch (error) {
      return toMcpError(error);
    }
    },
  );

  server.registerTool(
    "get_all_user_urls",
    {
      description: "Retrieves all urls created by a user",
    },
    async () => {
      const result = await urlService.getAllUrlsOfUser(userId, {});

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result),
          },
        ],
      };
    },
  );
}

export async function startMcpServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const transports: Record<string, SSEServerTransport> = {};

  // SSE endpoint — Chatbot connects here
  app.get("/sse", apiKeyMiddleware, async (req, res): Promise<void> => {
    // Create a new server instance for each session to avoid state sharing issues
    const server = new McpServer({
      name: "url-shortener-mcp",
      version: "1.0.0",
    });

    const userId = (req as any).user?.toString();

    registerTools(server, userId);

    const transport = new SSEServerTransport("/messages", res);
    transports[transport.sessionId] = transport;
    await server.connect(transport);

    res.on("close", () => {
      delete transports[transport.sessionId];
    });
  });

  // Message endpoint — Chatbot posts tool calls here
  app.post("/messages", apiKeyMiddleware, async (req, res): Promise<void> => {
    const sessionId = req.query.sessionId as string;
    const transport = transports[sessionId];
    if (!transport) {
      res.status(404).json({ error: "Session not found" });
      return;
    }
    await transport.handlePostMessage(req, res, req.body);
  });

  app.listen(4200, () => {
    logger.info("MCP SSE server running on http://localhost:4200");
  });
}

// to start inspector, run `npx @modelcontextprotocol/inspector` in terminal and
// open http://localhost:4200/sse in browser. You can then call the registered
// tools from the inspector UI.
