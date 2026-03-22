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
        const result = await authService.register(input);
        logger.info("User registered", result);
        return result;
      } catch (error) {
        logger.error(`Error registering user: `, error);
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
          maxAge: 10 * 60 * 1000, //  10 mins
        });


        return result;
      } catch (error) {
        logger.error(`Error logging user: `, error);
        handleAppError(error);
      }
    }),

  refreshToken: publicProcedure
    .input(
      z.object({
        refreshToken: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const tokens = await authService.refreshTokens(input.refreshToken);

        ctx.res.cookie("accessToken", tokens.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 10 * 60 * 1000, //  10 mins
        });

        logger.info(`Token refreshed for user ${tokens.userId}`)
        return tokens;
      } catch (error) {
        logger.error(`Error refreshing token: `, error);
        handleAppError(error);
      }
    }),

  logout: loggedInUserProcedure.mutation(async ({ ctx }) => {
    try {
      await authService.logout(ctx.user!.userId);
      logger.info(`User ${ctx.user!.userId} logged out`);
      ctx.res.clearCookie("accessToken");
    } catch (error) {
      logger.error(`Error logging out user: `, error);
      handleAppError(error);
    }
  }),


  updateUser: loggedInUserProcedure
    .input(
      z.object({
        name: z.string().min(2).optional(),
        password: z.string().min(6).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const updatedUser = await authService.updateUser(ctx.user!.userId, input);
        logger.info(`User ${ctx.user!.userId} updated`);
        return updatedUser;
      } catch (error) {
        logger.error(`Error updating user: `, error);
        handleAppError(error);
      }
    }),


  me: loggedInUserProcedure.query(async ({ ctx }) => {
    try {
      const user = await authService.getUserById(ctx.user!.userId);
      return user;
    } catch (error) {
      logger.error(`Error fetching user profile: `, error);
      handleAppError(error);
    }
  }),
};
