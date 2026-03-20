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

const urlService = new UrlService(
  new UrlRepository(),
  new CacheRepository(),
  new AnalyticsRepository(),
);

function registerTools(server: McpServer) {
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
}

export async function startMcpServer() {
  const app = express();
  app.use(cors());

  const transports: Record<string, SSEServerTransport> = {};

  // SSE endpoint — Chatbot connects here
  app.get("/sse", async (req, res) => {
    // Create a new server instance for each session to avoid state sharing issues
    const server = new McpServer({
      name: "url-shortener-mcp",
      version: "1.0.0",
    });

    registerTools(server);

    const transport = new SSEServerTransport("/messages", res);
    transports[transport.sessionId] = transport;
    await server.connect(transport);

    res.on("close", () => {
      delete transports[transport.sessionId];
    });
  });

  // Message endpoint — Chatbot posts tool calls here
  app.post("/messages", express.json(), async (req, res) => {
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
