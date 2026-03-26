import { z } from "zod";
import {
  loggedInUserProcedure,
  publicProcedure,
} from "../routers/trpc/context";
import logger from "../config/logger.config";
import { handleAppError } from "../utils/errors/trpc.error";
import { ApiKeyStatus } from "../models/apiKey.model";
import { ApiKeyFactory } from "../factories/apiKey.factory";

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
        const result = await apiKeyService.createApiKey(
          ctx.user!.userId,
          input?.description,
        );
        logger.info(`API key created for user ${ctx.user!.userId}`);
        return result;
      } catch (error) {
        logger.error(
          `Error creating API key for user ${ctx.user!.userId}:`,
          error,
        );
        handleAppError(error);
      }
    }),

  getApiKeys: loggedInUserProcedure.query(async ({ ctx }) => {
    try {
      const apiKeys = await apiKeyService.getUserApiKeys(ctx.user!.userId);
      logger.info(`Fetched API keys for user ${ctx.user!.userId}`);
      return apiKeys;
    } catch (error) {
      logger.error(
        `Error fetching API keys for user ${ctx.user!.userId}:`,
        error,
      );
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
        await apiKeyService.updateApiKeyStatus(
          input.id,
          input.status,
          ctx.user!.userId,
        );
        logger.info(
          `API key ${input.id} status updated to ${input.status} by user ${ctx.user!.userId}`,
        );
        return { success: true };
      } catch (error) {
        logger.error(`Error updating API key status:`, error);
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
        await apiKeyService.deleteApiKey(input.id, ctx.user!.userId);
        logger.info(`API key ${input.id} deleted by user ${ctx.user!.userId}`);
        return { success: true };
      } catch (error) {
        logger.error(`Error deleting API key:`, error);
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
        const result = await apiKeyService.verifyApiKey(input.apiKey);
        if (!result) {
          throw new Error("Invalid API key");
        }
        logger.info(`API key verified for user ${result.userId}`);
        return result;
      } catch (error) {
        logger.error(`Error verifying API key:`, error);
        handleAppError(error);
      }
    }),
};
