import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";
import cors from "cors";
import logger from "./config/logger.config";
import { registerUrlShortenerTools } from "./mcp/tools/url.tools";
import { apiKeyMiddleware } from "./mcp/middleware/apikey.middleware";

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

    registerUrlShortenerTools(server, userId);

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
