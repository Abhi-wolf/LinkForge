import { z } from "zod";
import {
  loggedInUserProcedure,
  publicProcedure,
} from "../routers/trpc/context";
import { createContextLogger } from "../config/logger.config";
import { handleAppError } from "../utils/errors/trpc.error";
import { AuthFactory } from "../factories/auth.factory";
import { serverConfig } from "../config";
import { maskEmail } from "../utils/email.utils";

const authLogger = createContextLogger("auth", "controller");
const authService = AuthFactory.getAuthService();

export const authController = {
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z
          .string()
          .min(6)
          .max(50, "Password cannot be more than 50 characters"),
        name: z
          .string()
          .min(2)
          .max(50, "Name cannot be more than 50 characters"),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      
      try {
        authLogger.info("register", "User registration validation started", {
          maskedEmail: maskEmail(input.email)
        });
        
        const result = await authService.register(input);
        
        authLogger.info("register", "User registration completed successfully", {
          userId: result.user.id,
          maskedEmail: maskEmail(input.email)
        });
        
        return result;
      } catch (error) {
        authLogger.warn("register", "User registration failed", {
          maskedEmail: maskEmail(input.email),
          err: error instanceof Error ? error : undefined
        });
        
        handleAppError(error);
      }
    }),

  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z
          .string()
          .max(50, "Password cannot be more than 50 characters"),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      
      try {
        authLogger.info("login", "User login attempt started", {
          maskedEmail: maskEmail(input.email)
        });
        
        const result = await authService.login(input);

        ctx.res.cookie("accessToken", result.accessToken, {
          httpOnly: true,
          secure: serverConfig.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 10 * 60 * 1000, //  10 mins
        });

        authLogger.info("login", "User login successful", {
          userId: result.user.id,
          maskedEmail: maskEmail(input.email)
        });

        return result;
      } catch (error) {
        authLogger.warn("login", "User login failed due to invalid credentials", {
          maskedEmail: maskEmail(input.email),
          err: error instanceof Error ? error : undefined
        });
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
        authLogger.info("refreshToken", "Token refresh attempt started");
        const tokens = await authService.refreshTokens(input.refreshToken);

        ctx.res.cookie("accessToken", tokens.accessToken, {
          httpOnly: true,
          secure: serverConfig.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 10 * 60 * 1000, //  10 mins
        });

        authLogger.info("refreshToken", "Token refresh successful", {
          userId: tokens.userId
        });
        return tokens;
      } catch (error) {
        authLogger.warn("refreshToken", "Token refresh failed due to invalid or expired token", {
          err: error instanceof Error ? error : undefined
        });
        handleAppError(error);
      }
    }),

  logout: loggedInUserProcedure.mutation(async ({ ctx }) => {
    try {
      authLogger.info("logout", "User logout attempt started", { userId: ctx.user!.userId });
      await authService.logout(ctx.user!.userId);
      authLogger.info("logout", "User logout successful", {
        userId: ctx.user!.userId
      });
      ctx.res.clearCookie("accessToken");
    } catch (error) {
      authLogger.error("logout", "Failed to process user logout", {
        userId: ctx.user!.userId,
        err: error instanceof Error ? error : undefined
      });
      handleAppError(error);
    }
  }),

  updateUser: loggedInUserProcedure
    .input(
      z.object({
        name: z
          .string()
          .min(2)
          .max(50, "Name cannot be more than 50 characters")
          .optional(),
        password: z
          .string()
          .min(6)
          .max(50, "Password cannot be more than 50 characters")
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        authLogger.info("updateUser", "User profile update attempt started", { userId: ctx.user!.userId });
        const updatedUser = await authService.updateUser(
          ctx.user!.userId,
          input,
        );
        authLogger.info("updateUser", "User profile updated successfully", {
          userId: ctx.user!.userId
        });
        return updatedUser;
      } catch (error) {
        authLogger.warn("updateUser", "User profile update failed", {
          userId: ctx.user!.userId,
          err: error instanceof Error ? error : undefined
        });
        handleAppError(error);
      }
    }),

  me: loggedInUserProcedure.query(async ({ ctx }) => {
    try {
      authLogger.info("me", "Fetching user profile", { userId: ctx.user!.userId });
      const user = await authService.getUserById(ctx.user!.userId);
      return user;
    } catch (error) {
      authLogger.error("me", "Failed to fetch user profile", {
        userId: ctx.user!.userId,
        err: error instanceof Error ? error : undefined
      });
      handleAppError(error);
    }
  }),

  sendEmailVerification: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        authLogger.info("sendEmailVerification", "Email verification request started", { maskedEmail: maskEmail(input.email) });
        const result = await authService.sendEmailVerification(input.email);
        authLogger.info("sendEmailVerification", "Email verification sent successfully", {
          maskedEmail: maskEmail(input.email)
        });
        return result;
      } catch (error) {
        authLogger.warn("sendEmailVerification", "Email verification send failed", {
          maskedEmail: maskEmail(input.email),
          err: error instanceof Error ? error : undefined
        });
        handleAppError(error);
      }
    }),

  verifyEmail: publicProcedure
    .input(
      z.object({
        token: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        authLogger.info("verifyEmail", "Email verification attempt started");
        const result = await authService.verifyEmail(input.token);
        authLogger.info("verifyEmail", "Email verification completed successfully", {
          tokenPrefix: input.token.substring(0, 8)
        });
        return result;
      } catch (error) {
        authLogger.warn("verifyEmail", "Email verification failed due to invalid token", {
          tokenPrefix: input.token.substring(0, 8),
          err: error instanceof Error ? error : undefined
        });
        handleAppError(error);
      }
    }),

  requestPasswordReset: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        authLogger.info("requestPasswordReset", "Password reset request started", { maskedEmail: maskEmail(input.email) });
        const result = await authService.requestPasswordReset(input.email);
        authLogger.info("requestPasswordReset", "Password reset email sent successfully", {
          maskedEmail: maskEmail(input.email)
        });
        return result;
      } catch (error) {
        authLogger.warn("requestPasswordReset", "Password reset email send failed", {
          maskedEmail: maskEmail(input.email),
          err: error instanceof Error ? error : undefined
        });
        handleAppError(error);
      }
    }),

  resetPassword: publicProcedure
    .input(
      z.object({
        token: z.string(),
        newPassword: z
          .string()
          .min(6)
          .max(50, "Password cannot be more than 50 characters"),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        authLogger.info("resetPassword", "Password reset attempt started");
        const result = await authService.resetPassword(
          input.token,
          input.newPassword,
        );
        authLogger.info("resetPassword", "Password reset completed successfully", {
          tokenPrefix: input.token.substring(0, 8)
        });
        return result;
      } catch (error) {
        authLogger.warn("resetPassword", "Password reset failed due to invalid token", {
          tokenPrefix: input.token.substring(0, 8),
          err: error instanceof Error ? error : undefined
        });
        handleAppError(error);
      }
    }),
};
