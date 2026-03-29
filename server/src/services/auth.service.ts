import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { serverConfig } from "../config";
import { UserRepository } from "../repositories/user.repository";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from "../utils/errors/app.error";
import { createContextLogger } from "../config/logger.config";
import EmailService from "./email.service";
import { maskEmail } from "../utils/email.utils";

const authLogger = createContextLogger("auth", "service");

export class AuthService {
  private emailService: EmailService;

  constructor(private readonly userRepository: UserRepository) {
    this.emailService = new EmailService();
  }

  /**
   * Register a new user
   * @param data - User registration data
   * @returns Promise<any> - Registered user
   */
  async register(data: any) {
    authLogger.info("register", "Checking if user already exists", { email: maskEmail(data.email) });
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      authLogger.warn("register", "User registration failed: already exists", { email: maskEmail(data.email) });
      throw new ConflictError("User already exists with this email");
    }

    authLogger.info("register", "Hashing password");
    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    authLogger.info("register", "Creating user record");
    const user = await this.userRepository.create({
      ...data,
      password: hashedPassword,
    });

    authLogger.info("register", "User created successfully", { userId: user._id?.toString() });

    // Send welcome email
    try {
      authLogger.info("register", "Attempting to send welcome email", { userId: user._id?.toString() });
      await this.emailService.sendWelcomeEmail(user.email, {
        userName: user.name,
        appName: serverConfig.APP_NAME,
      });
      authLogger.info("register", "Welcome email sent successfully", { userId: user._id?.toString() });
    } catch (error) {
      authLogger.error("register", "Failed to send welcome email", {
        event: "EMAIL_WELCOME_SEND_FAILED",
        maskedEmail: maskEmail(user.email),
        userId: user._id?.toString(),
        err: error instanceof Error ? error : undefined
      });
    }

    return {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
      },
    };
  }

  /**
   * Send email verification
   * @param email - User email
   * @returns Promise<{ message: string }> - Message indicating verification email sent
   */
  async sendEmailVerification(email: string) {
    authLogger.info("sendEmailVerification", "Finding user for verification email", { email: maskEmail(email) });
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      authLogger.info("sendEmailVerification", "User not found, returning generic success to avoid email enumeration", { email: maskEmail(email) });
      // Don't reveal if email exists for security
      return {
        message:
          "If an account exists with this email, a verification link has been sent",
      };
    }

    if (user.emailVerified) {
      authLogger.warn("sendEmailVerification", "Email already verified", { userId: user._id?.toString() });
      throw new ConflictError("Email already verified");
    }

    authLogger.info("sendEmailVerification", "Setting email verification token", { userId: user._id?.toString() });
    const token = await this.userRepository.setEmailVerificationToken(
      user._id.toString(),
    );
    const verificationLink = `${serverConfig.CLIENT_URL}/verify-email?token=${token}`;

    authLogger.info("sendEmailVerification", "Sending verification email", { userId: user._id?.toString() });
    await this.emailService.sendEmailVerification(user.email, {
      userName: user.name,
      verificationLink,
      appName: serverConfig.APP_NAME,
    });
    authLogger.info("sendEmailVerification", "Verification email sent", { userId: user._id?.toString() });

    return { message: "Verification email sent" };
  }

  /**
   * Verify email
   * @param token - Verification token
   * @returns Promise<{ message: string }> - Message indicating verification status
   */
  async verifyEmail(token: string) {
    authLogger.info("verifyEmail", "Verifying email with token");
    const user = await this.userRepository.findByEmailVerificationToken(token);
    if (!user) {
      authLogger.warn("verifyEmail", "Invalid or expired verification token used");
      throw new UnauthorizedError("Invalid or expired verification token");
    }

    authLogger.info("verifyEmail", "Setting email status to verified", { userId: user._id?.toString() });
    await this.userRepository.verifyEmail(user._id.toString());
    authLogger.info("verifyEmail", "Email verified successfully", { userId: user._id?.toString() });

    return { message: "Email verified successfully" };
  }

  /**
   * Request password reset
   * @param email - User email
   * @returns Promise<{ message: string }> - Message indicating reset email sent
   */
  async requestPasswordReset(email: string) {
    authLogger.info("requestPasswordReset", "Requesting password reset", { email: maskEmail(email) });
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      authLogger.info("requestPasswordReset", "User not found, returning generic success", { email: maskEmail(email) });
      return {
        message:
          "If an account exists with this email, a password reset link has been sent",
      };
    }

    authLogger.info("requestPasswordReset", "Setting password reset token", { userId: user._id?.toString() });
    const token = await this.userRepository.setPasswordResetToken(
      user._id.toString(),
    );
    const resetLink = `${serverConfig.CLIENT_URL}/reset-password?token=${token}`;

    authLogger.info("requestPasswordReset", "Sending forgot password email", { userId: user._id?.toString() });
    await this.emailService.sendForgotPassword(user.email, {
      userName: user.name,
      resetLink,
      appName: serverConfig.APP_NAME,
      expiryMinutes: 30,
    });
    authLogger.info("requestPasswordReset", "Forgot password email sent", { userId: user._id?.toString() });

    return {
      message:
        "If an account exists with this email, a password reset link has been sent",
    };
  }

  /**
   * Reset password
   * @param token - Reset token
   * @param newPassword - New password
   * @returns Promise<{ message: string }> - Message indicating reset status
   */
  async resetPassword(token: string, newPassword: string) {
    authLogger.info("resetPassword", "Resetting password with token");
    const user = await this.userRepository.findByPasswordResetToken(token);
    if (!user) {
      authLogger.warn("resetPassword", "Invalid or expired reset token used");
      throw new UnauthorizedError("Invalid or expired reset token");
    }

    authLogger.info("resetPassword", "Hashing new password", { userId: user._id?.toString() });
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    authLogger.info("resetPassword", "Updating user password", { userId: user._id?.toString() });
    await this.userRepository.update(user._id.toString(), {
      password: hashedPassword,
    });

    authLogger.info("resetPassword", "Clearing reset token and incrementing version", { userId: user._id?.toString() });
    await this.userRepository.clearPasswordResetToken(user._id.toString());
    await this.userRepository.incrementTokenVersion(user._id.toString());

    // Send confirmation email
    try {
      authLogger.info("resetPassword", "Sending password reset confirmation", { userId: user._id?.toString() });
      await this.emailService.sendPasswordResetConfirmation(user.email, {
        userName: user.name,
        appName: serverConfig.APP_NAME,
      });
      authLogger.info("resetPassword", "Password reset confirmation sent", { userId: user._id?.toString() });
    } catch (error) {
      authLogger.error("resetPassword", "Failed to send password reset confirmation email", {
        event: "EMAIL_PASSWORD_RESET_CONFIRM_SEND_FAILED",
        maskedEmail: maskEmail(user.email),
        userId: user._id?.toString(),
        err: error instanceof Error ? error : undefined
      });
    }

    authLogger.info("resetPassword", "Password reset completed", { userId: user._id?.toString() });
    return { message: "Password reset successfully" };
  }

  /**
   * Login user
   * @param data - Login data
   * @returns Promise<{ user: any, tokens: any }> - User and tokens
   */
  async login(data: any) {
    authLogger.info("login", "Attempting login", { email: maskEmail(data.email) });
    const user = await this.userRepository.findByEmail(data.email);
    if (!user) {
      authLogger.warn("login", "Login failed: User not found", { email: maskEmail(data.email) });
      throw new UnauthorizedError("Invalid email or password");
    }

    authLogger.info("login", "Comparing password hash", { userId: user._id?.toString() });
    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      authLogger.warn("login", "Login failed: Invalid password", { userId: user._id?.toString() });
      throw new UnauthorizedError("Invalid email or password");
    }

    if (!user.emailVerified) {
      authLogger.warn("login", "Login failed: Email not verified", { userId: user._id?.toString() });
      throw new ForbiddenError("EMAIL_NOT_VERIFIED");
    }

    authLogger.info("login", "Generating tokens", { userId: user._id?.toString() });
    const tokens = this.generateTokens(user);
    
    authLogger.info("login", "User logged in successfully", {
      userId: user._id?.toString(),
      email: maskEmail(user.email),
    });

    return {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
      },
      ...tokens,
    };
  }

  /**
   * Update user
   * @param userId - User ID
   * @param data - Update data
   * @returns Promise<any> - Updated user
   */
  async updateUser(userId: string, data: any) {
    authLogger.info("updateUser", "Fetching user for update", { userId });
    const user = await this.userRepository.findById(userId);

    if (!user) {
      authLogger.warn("updateUser", "User not found for update", { userId });
      throw new NotFoundError("User not found");
    }

    if (data.password) {
      authLogger.info("updateUser", "Hashing new password", { userId });
      const hashedPassword = await bcrypt.hash(data.password, 10);
      data.password = hashedPassword;
    }

    authLogger.info("updateUser", "Performing user update in DB", { userId });
    const updatedUser = await this.userRepository.update(userId, data);
    authLogger.info("updateUser", "User updated successfully", { userId });

    return updatedUser;
  }

  /**
   * Refresh tokens
   * @param refreshToken - Refresh token
   * @returns Promise<{ accessToken: string, refreshToken: string }> - New tokens
   */
  async refreshTokens(refreshToken: string) {
    try {
      authLogger.info("refreshTokens", "Verifying refresh token");
      const decoded: any = jwt.verify(
        refreshToken,
        serverConfig.JWT_REFRESH_SECRET,
      );

      authLogger.info("refreshTokens", "Refresh token decoded successfully", {
        userId: decoded.userId,
        tokenVersion: decoded.tokenVersion
      });

      authLogger.info("refreshTokens", "Finding user for token refresh", { userId: decoded.userId });
      const user = await this.userRepository.findById(decoded.userId);

      if (!user || user.tokenVersion !== decoded.tokenVersion) {
        authLogger.warn("refreshTokens", "Invalid refresh token or token version mismatch", { userId: decoded.userId });
        throw new UnauthorizedError("Invalid refresh token");
      }

      authLogger.info("refreshTokens", "Incrementing token version", { userId: user._id?.toString() });
      const updatedUser = await this.userRepository.incrementTokenVersion(
        decoded.userId,
      );

      if (!updatedUser) {
        authLogger.error("refreshTokens", "User no longer exists during refresh", { userId: decoded.userId });
        throw new UnauthorizedError("User no longer exists");
      }

      authLogger.info("refreshTokens", "Generating new tokens", { userId: updatedUser._id?.toString() });
      const tokens = this.generateTokens(updatedUser);

      authLogger.info("refreshTokens", "New tokens generated successfully", {
        userId: updatedUser._id?.toString()
      });

      return {
        userId: updatedUser._id?.toString(),
        ...tokens,
      };
    } catch (error) {
      authLogger.warn("refreshTokens", "Token refresh failed", { err: error instanceof Error ? error.message : undefined });
      throw new UnauthorizedError("Invalid or expired refresh token");
    }
  }

  /**
   * Logout user
   * @param userId - User ID
   */
  async logout(userId: string) {
    authLogger.info("logout", "Logging out user: incrementing token version", { userId });
    await this.userRepository.incrementTokenVersion(userId);
    authLogger.info("logout", "User logged out successfully", { userId });
  }

  /**
   * Get user by ID
   * @param userId - User ID
   * @returns Promise<{ id: string, email: string, name: string }> - User data
   */
  async getUserById(userId: string) {
    authLogger.info("getUserById", "Fetching user data", { userId });
    const user = await this.userRepository.getUserById(userId);
    if (!user) {
      authLogger.warn("getUserById", "User not found", { userId });
      throw new NotFoundError("User not found");
    }

    return {
      id: user._id,
      email: user.email,
      name: user.name,
    };
  }

  /**
   * Generate access and refresh tokens
   * @param user - User object
   * @returns { accessToken: string, refreshToken: string } - Generated tokens
   */
  private generateTokens(user: any) {
    try {
      const accessToken = jwt.sign(
        { userId: user._id, email: user.email },
        serverConfig.JWT_ACCESS_SECRET,
        { expiresIn: serverConfig.ACCESS_TOKEN_EXPIRE as any },
      );

      const refreshToken = jwt.sign(
        { userId: user._id, tokenVersion: user.tokenVersion },
        serverConfig.JWT_REFRESH_SECRET,
        { expiresIn: serverConfig.REFRESH_TOKEN_EXPIRE as any },
      );

      return { accessToken, refreshToken };
    } catch (error) {
      authLogger.error("generateTokens", "Token generation failed", {
        event: "AUTH_TOKEN_GENERATION_FAILED",
        err: error instanceof Error ? error : undefined
      });
      throw new Error("Failed to generate tokens");
    }
  }
}
