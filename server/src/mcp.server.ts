import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";
import cors from "cors";
import logger from "./config/logger.config";
import { registerUrlShortenerTools } from "./mcp/tools/url.tools";
import { apiKeyMiddleware } from "./mcp/middleware/apikey.middleware";
import { attachCorrelationIdMiddleware } from "./middlewares/correlation.middleware";
import { serverConfig } from "./config";

const app = express();
app.use(cors());
app.use(express.json());

app.use(attachCorrelationIdMiddleware);

export async function startMcpServer() {
  const transports: Record<string, SSEServerTransport> = {};

  logger.info("Starting MCP SSE server...");
  // SSE endpoint — Chatbot connects here
  app.get("/sse", apiKeyMiddleware, async (req, res): Promise<void> => {
    // Create a new server instance for each session to avoid state sharing issues

    try {
      const userId = (req as any).user?.toString();

      logger.info("Incoming SSE connection request", {
        userId,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
      });

      const server = new McpServer({
        name: "url-shortener-mcp",
        version: "1.0.0",
      });

      logger.info("MCP server instance created", { userId });

      registerUrlShortenerTools(server, userId);

      logger.info("MCP tools registered successfully", { userId });

      const transport = new SSEServerTransport("/messages", res);
      transports[transport.sessionId] = transport;
      await server.connect(transport);

      logger.info("MCP server connected to transport", {
        sessionId: transport.sessionId,
        userId,
      });

      res.on("close", () => {
        logger.info("SSE connection closed", {
          sessionId: transport.sessionId,
          userId,
        });
        delete transports[transport.sessionId];
      });

      res.on("error", (err) => {
        logger.error("SSE connection error", {
          sessionId: transport.sessionId,
          error: err.message,
        });
      });
    } catch (error: any) {
      logger.error("Error establishing SSE connection", {
        error: error?.message,
        stack: error?.stack,
      });

      res.status(500).end();
    }
  });

  // Message endpoint — Chatbot posts tool calls here
  app.post("/messages", apiKeyMiddleware, async (req, res): Promise<void> => {
    try {
      const sessionId = req.query.sessionId as string;
      const transport = transports[sessionId];

      logger.info("Incoming MCP message", {
        sessionId,
        correlationId: (req as any).correlationId,
      });

      if (!transport) {
        logger.warn("Session not found for MCP message", { sessionId });

        res.status(404).json({ error: "Session not found" });
        return;
      }

      await transport.handlePostMessage(req, res, req.body);

      logger.info("MCP message processed successfully", {
        sessionId,
      });
    } catch (error: any) {
      logger.error("Error processing MCP message", {
        error: error.message,
        stack: error.stack,
      });

      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.listen(serverConfig.MCP_SERVER_PORT, () => {
    logger.info("MCP SSE server running", {
      url: `http://localhost:${serverConfig.MCP_SERVER_PORT}`,
      sse: `http://localhost:${serverConfig.MCP_SERVER_PORT}/sse`,
      messages: `http://localhost:${serverConfig.MCP_SERVER_PORT}/messages`,
      environment: serverConfig.NODE_ENV,
    });
  });
}

// to start inspector, run `npx @modelcontextprotocol/inspector` in terminal and
// open http://localhost:4200/sse in browser. You can then call the registered
// tools from the inspector UI.
