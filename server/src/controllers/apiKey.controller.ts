import { z } from "zod";
import {
  loggedInUserProcedure,
  publicProcedure,
} from "../routers/trpc/context";
import { createContextLogger } from "../config/logger.config";
import { handleAppError } from "../utils/errors/trpc.error";
import { ApiKeyStatus } from "../models/apiKey.model";
import { ApiKeyFactory } from "../factories/apiKey.factory";

const apiKeyLogger = createContextLogger("auth", "controller");
const apiKeyService = ApiKeyFactory.getApiKeyService();

export const apiKeyController = {
  createApiKey: loggedInUserProcedure
    .input(
      z
        .object({
          description: z.string().max(100, "Description too long").optional(),
        })
        .optional(),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        apiKeyLogger.info("createApiKey", "API key creation attempt started", { userId: ctx.user!.userId });
        const result = await apiKeyService.createApiKey(
          ctx.user!.userId,
          input?.description,
        );
        apiKeyLogger.info("createApiKey", "API key created successfully", {
          userId: ctx.user!.userId,
          apiKeyId: result.id
        });
        return result;
      } catch (error) {
        apiKeyLogger.warn("createApiKey", "API key creation failed", {
          userId: ctx.user!.userId,
          err: error instanceof Error ? error : undefined
        });
        handleAppError(error);
      }
    }),

  getApiKeys: loggedInUserProcedure.query(async ({ ctx }) => {
    try {
      apiKeyLogger.info("getApiKeys", "Fetching API keys for user", { userId: ctx.user!.userId });
      const apiKeys = await apiKeyService.getUserApiKeys(ctx.user!.userId);
      apiKeyLogger.info("getApiKeys", "API keys fetched successfully", {
        userId: ctx.user!.userId,
        count: apiKeys.length
      });
      return apiKeys;
    } catch (error) {
      apiKeyLogger.error("getApiKeys", "Failed to fetch user API keys", {
        userId: ctx.user!.userId,
        err: error instanceof Error ? error : undefined
      });
      handleAppError(error);
    }
  }),

  updateStatus: loggedInUserProcedure
    .input(
      z.object({
        id: z
          .string()
          .min(24, "API Key ID is required")
          .max(24, "API Key ID is invalid"),
        status: z.nativeEnum(ApiKeyStatus),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        apiKeyLogger.info("updateStatus", "API key status update attempt started", {
          userId: ctx.user!.userId,
          apiKeyId: input.id,
          status: input.status
        });
        await apiKeyService.updateApiKeyStatus(
          input.id,
          input.status,
          ctx.user!.userId,
        );
        apiKeyLogger.info("updateStatus", "API key status updated successfully", {
          userId: ctx.user!.userId,
          apiKeyId: input.id,
          status: input.status
        });
        return { success: true };
      } catch (error) {
        apiKeyLogger.warn("updateStatus", "API key status update failed", {
          userId: ctx.user!.userId,
          apiKeyId: input.id,
          status: input.status,
          err: error instanceof Error ? error : undefined
        });
        handleAppError(error);
      }
    }),

  deleteApiKey: loggedInUserProcedure
    .input(
      z.object({
        id: z
          .string()
          .min(24, "API Key ID is required")
          .max(24, "API Key ID is invalid"),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        apiKeyLogger.info("deleteApiKey", "API key deletion attempt started", {
          userId: ctx.user!.userId,
          apiKeyId: input.id
        });
        await apiKeyService.deleteApiKey(input.id, ctx.user!.userId);
        apiKeyLogger.info("deleteApiKey", "API key deleted successfully", {
          userId: ctx.user!.userId,
          apiKeyId: input.id
        });
        return { success: true };
      } catch (error) {
        apiKeyLogger.warn("deleteApiKey", "API key deletion failed", {
          userId: ctx.user!.userId,
          apiKeyId: input.id,
          err: error instanceof Error ? error : undefined
        });
        handleAppError(error);
      }
    }),

  verifyApiKey: publicProcedure
    .input(
      z.object({
        apiKey: z
          .string()
          .min(1, "API key is required")
          .max(100, "API key is invalid"),
      }),
    )
    .query(async ({ input }) => {
      try {
        apiKeyLogger.info("verifyApiKey", "API key verification attempt started");
        const result = await apiKeyService.verifyApiKey(input.apiKey);
        if (!result) {
          apiKeyLogger.warn("verifyApiKey", "API key verification failed - invalid key", {
            apiKeyPrefix: input.apiKey.substring(0, 8)
          });
          throw new Error("Invalid API key");
        }
        apiKeyLogger.info("verifyApiKey", "API key verified successfully", {
          userId: result.userId,
          apiKeyPrefix: input.apiKey.substring(0, 8)
        });
        return result;
      } catch (error) {
        apiKeyLogger.warn("verifyApiKey", "API key verification failed", {
          apiKeyPrefix: input.apiKey.substring(0, 8),
          err: error instanceof Error ? error : undefined
        });
        handleAppError(error);
      }
    }),
};
