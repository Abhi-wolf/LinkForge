import { TRPCError } from "@trpc/server";
import { t } from "../routers/trpc/trpc";
import jwt from "jsonwebtoken";
import { serverConfig } from "../config";
import logger from "../config/logger.config";

export function isAuthenticated() {
  return t.middleware(async ({ ctx, next }) => {
    const token =
      ctx.req.headers?.authorization?.split(" ")[1] ||
      ctx.req.cookies.accessToken;

    if (!token) {
      logger.warn("Authentication failed - no token provided", {
        event: "AUTH_TOKEN_MISSING"
      });
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid authorization header format",
      });
    }

    if (!serverConfig.JWT_ACCESS_SECRET) {
      logger.error("Authentication configuration error - JWT secret missing", {
        event: "AUTH_CONFIG_ERROR"
      });
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "JWT_ACCESS_SECRET is not defined",
      });
    }

    try {
      const decoded = jwt.verify(token, serverConfig.JWT_ACCESS_SECRET) as {
        userId: string;
        tokenVersion: number;
      };

      ctx.user = decoded;
      return next({ ctx });
    } catch (err) {
      logger.warn("Authentication failed - invalid token", {
        event: "AUTH_TOKEN_INVALID",
        err: err instanceof Error ? err : undefined
      });
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid token",
      });
    }
  });
}

export function attachUserIfPresent() {
  return t.middleware(async ({ ctx, next }) => {
    const token =
      ctx.req.headers?.authorization?.split(" ")[1] ||
      ctx.req.cookies.accessToken;

    if (!token) {
      return next({ ctx });
    }

    try {
      const decoded = jwt.verify(token, serverConfig.JWT_ACCESS_SECRET!) as {
        userId: string;
        tokenVersion: number;
      };

      ctx.user = decoded;
      return next({ ctx });
    } catch (err) {
      logger.warn("Optional authentication failed - invalid token", {
        event: "AUTH_TOKEN_ATTACH_INVALID",
        err: err instanceof Error ? err : undefined
      });
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid token",
      });
    }
  });
}
