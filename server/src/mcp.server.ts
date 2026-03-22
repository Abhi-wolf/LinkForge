import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { UrlRepository } from "./repositories/url.repository";
import { CacheRepository } from "./repositories/cache.repository";
import { UrlService } from "./services/url.service";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";
import cors from "cors";
import { AnalyticsRepository } from "./repositories/analytics.repository";
import logger from "./config/logger.config";
import { AnalyticsService } from "./services/analytics.service";
import { apiKeyMiddleware } from "./middlewares/apikey.middleware";

const urlService = new UrlService(
  new UrlRepository(),
  new CacheRepository(),
  new AnalyticsRepository(),
);

const analyticsService=new AnalyticsService(new AnalyticsRepository(),new UrlRepository())

function registerTools(server: McpServer,userId:string) {
  server.registerTool(
    "create_short_url",
    {
      description: "Creates a short URL",
      inputSchema: {
        originalUrl: z.string().describe("The original URL to be shortened"),
      },
    },
    async (args: { originalUrl: string }) => {
      const result = await urlService.createShortUrl({
        originalUrl: args.originalUrl,
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
      description:"Retrieves analytics info about a short url",
      inputSchema:{
        shortUrl:z.string().describe("The short URL ID"),
        startDate:z.coerce.date().describe("Date from which the analytics you want"),
        endDate:z.coerce.date().describe("Date upto which the analytics you want")
      }
    },
    async (args:{shortUrl:string,startDate:Date,endDate:Date}) => {

      const urlInfo = await urlService.getOriginalUrl(args.shortUrl);
      
      if(!urlInfo){
        throw new Error("URL not found");
      }

      const result=await analyticsService.getAnalyticsForUrlId(urlInfo.urlId,args.startDate,args.endDate);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result),
          },
        ],
      }; 
    }
  )

    server.registerTool(
    "get_all_user_urls",
    {
      description:"Retrieves all urls created by a user"
    },
    async () => {

      const result=await urlService.getAllUrlsOfUser(userId,{});

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result),
          },
        ],
      }; 
    }
  )
}

export async function startMcpServer() {
  const app = express();
  app.use(cors());
  app.use(express.json())

  const transports: Record<string, SSEServerTransport> = {};

  // SSE endpoint — Chatbot connects here
  app.get("/sse", apiKeyMiddleware,async (req, res): Promise<void> => {
    // Create a new server instance for each session to avoid state sharing issues
    const server = new McpServer({
      name: "url-shortener-mcp",
      version: "1.0.0",
    });

    const userId=(req as any).user;

    registerTools(server,userId);

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
