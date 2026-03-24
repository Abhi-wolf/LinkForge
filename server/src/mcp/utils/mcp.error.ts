import logger from "../../config/logger.config";
import { AppError } from "../../utils/errors/app.error";

type McpToolResult = {
  content: { type: "text"; text: string }[];
  isError?: boolean;
};

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

export function withMcpErrorHandling<T>(
  fn: (args: T) => Promise<McpToolResult>,
): (args: T) => Promise<McpToolResult> {
  return async (args: T) => {
    try {
      return await fn(args);
    } catch (error: any) {
      logger.error("MCP Tool Error", {
        message: error.message,
        stack: error.stack,
      });
      return toMcpError(error);
    }
  };
}
