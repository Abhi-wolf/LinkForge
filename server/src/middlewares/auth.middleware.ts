import { TRPCError } from "@trpc/server";
import { t } from "../routers/trpc/trpc";
import jwt from "jsonwebtoken";
import { serverConfig } from "../config";

export function isAuthenticated() {
  return t.middleware(async ({ ctx, next }) => {
    const token =
      ctx.req.headers?.authorization?.split(" ")[1] ||
      ctx.req.cookies.accessToken;

    if (!token) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid authorization header format",
      });
    }

    if (!serverConfig.JWT_ACCESS_SECRET) {
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
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid token",
      });
    }
  });
}
