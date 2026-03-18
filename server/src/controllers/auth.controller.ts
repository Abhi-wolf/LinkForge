import { z } from "zod";
import { UserRepository } from "../repositories/user.repository";
import { AuthService } from "../services/user.service";
import {
  loggedInUserProcedure,
  publicProcedure,
} from "../routers/trpc/context";
import logger from "../config/logger.config";
import { handleAppError } from "../utils/errors/trpc.error";

const userRepository = new UserRepository();
const authService = new AuthService(userRepository);

export const authController = {
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().min(2),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        logger.info("Registering user");
        const result = await authService.register(input);
        logger.info("User registered", result);
        return result;
      } catch (error) {
        logger.error(`Error registering user: ${error}`);
        handleAppError(error);
      }
    }),

  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await authService.login(input);
        logger.info("User logged in", result);

        ctx.res.cookie("accessToken", result.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        ctx.res.cookie("refreshToken", result.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        return result;
      } catch (error) {
        logger.error(`Error logging user: ${error}`);
        handleAppError(error);
      }
    }),

  refreshToken: publicProcedure
    .input(
      z.object({
        refreshToken: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const result = await authService.login(input);
        return result;
      } catch (error) {
        logger.error(`Error refreshing token: ${error}`);
        handleAppError(error);
      }
    }),

  logout: loggedInUserProcedure.mutation(async ({ ctx }) => {
    try {
      await authService.logout(ctx.user!.userId);
    } catch (error) {
      logger.error(`Error logging out user: ${error}`);
      handleAppError(error);
    }
  }),

  me: loggedInUserProcedure.query(async ({ ctx }) => {
    try {
      await authService.getUserById(ctx.user!.userId);
    } catch (error) {
      logger.error(`Error fetching user profile: ${error}`);
      handleAppError(error);
    }
  }),
};
