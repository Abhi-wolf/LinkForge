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
import logger from "../config/logger.config";
import EmailService from "./email.service";

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
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictError("User already exists with this email");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await this.userRepository.create({
      ...data,
      password: hashedPassword,
    });

    // Send welcome email
    try {
      await this.emailService.sendWelcomeEmail(user.email, {
        userName: user.name,
        appName: serverConfig.APP_NAME,
      });
    } catch (error) {
      logger.error("Failed to send welcome email", error);
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
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      // Don't reveal if email exists for security
      return {
        message:
          "If an account exists with this email, a verification link has been sent",
      };
    }

    if (user.emailVerified) {
      throw new ConflictError("Email already verified");
    }

    const token = await this.userRepository.setEmailVerificationToken(
      user._id.toString(),
    );
    const verificationLink = `${serverConfig.CLIENT_URL}/verify-email?token=${token}`;

    await this.emailService.sendEmailVerification(user.email, {
      userName: user.name,
      verificationLink,
      appName: serverConfig.APP_NAME,
    });

    return { message: "Verification email sent" };
  }

  /**
   * Verify email
   * @param token - Verification token
   * @returns Promise<{ message: string }> - Message indicating verification status
   */
  async verifyEmail(token: string) {
    const user = await this.userRepository.findByEmailVerificationToken(token);
    if (!user) {
      throw new UnauthorizedError("Invalid or expired verification token");
    }

    await this.userRepository.verifyEmail(user._id.toString());

    return { message: "Email verified successfully" };
  }

  /**
   * Request password reset
   * @param email - User email
   * @returns Promise<{ message: string }> - Message indicating reset email sent
   */
  async requestPasswordReset(email: string) {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      return {
        message:
          "If an account exists with this email, a password reset link has been sent",
      };
    }

    const token = await this.userRepository.setPasswordResetToken(
      user._id.toString(),
    );
    const resetLink = `${serverConfig.CLIENT_URL}/reset-password?token=${token}`;

    await this.emailService.sendForgotPassword(user.email, {
      userName: user.name,
      resetLink,
      appName: serverConfig.APP_NAME,
      expiryMinutes: 30,
    });

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
    const user = await this.userRepository.findByPasswordResetToken(token);
    if (!user) {
      throw new UnauthorizedError("Invalid or expired reset token");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.userRepository.update(user._id.toString(), {
      password: hashedPassword,
    });

    await this.userRepository.clearPasswordResetToken(user._id.toString());
    await this.userRepository.incrementTokenVersion(user._id.toString());

    // Send confirmation email
    try {
      await this.emailService.sendPasswordResetConfirmation(user.email, {
        userName: user.name,
        appName: serverConfig.APP_NAME,
      });
    } catch (error) {
      logger.error("Failed to send password reset confirmation email", error);
    }

    return { message: "Password reset successfully" };
  }

  /**
   * Login user
   * @param data - Login data
   * @returns Promise<{ user: any, tokens: any }> - User and tokens
   */
  async login(data: any) {
    const user = await this.userRepository.findByEmail(data.email);
    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    if (!user.emailVerified) {
      throw new ForbiddenError("EMAIL_NOT_VERIFIED");
    }

    const tokens = this.generateTokens(user);
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
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    if (data.password) {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      data.password = hashedPassword;
    }

    const updatedUser = await this.userRepository.update(userId, data);

    return updatedUser;
  }

  /**
   * Refresh tokens
   * @param refreshToken - Refresh token
   * @returns Promise<{ accessToken: string, refreshToken: string }> - New tokens
   */
  async refreshTokens(refreshToken: string) {
    try {
      const decoded: any = jwt.verify(
        refreshToken,
        serverConfig.JWT_REFRESH_SECRET,
      );

      logger.info(`Refresh token decoded = ${JSON.stringify(decoded)}`);

      const user = await this.userRepository.findById(decoded.userId);

      if (!user || user.tokenVersion !== decoded.tokenVersion) {
        throw new UnauthorizedError("Invalid refresh token");
      }

      logger.info(`Got user from repository ${user._id}`);

      const updatedUser = await this.userRepository.incrementTokenVersion(
        decoded.userId,
      );

      logger.info(`Incremented token version for user ${decoded.userId}`);

      if (!updatedUser) {
        throw new UnauthorizedError("User no longer exists");
      }

      const tokens = this.generateTokens(updatedUser);

      logger.info(`Generated new tokens for user ${updatedUser._id}`);

      return {
        userId: updatedUser._id?.toString(),
        ...tokens,
      };
    } catch (error) {
      throw new UnauthorizedError("Invalid or expired refresh token");
    }
  }

  /**
   * Logout user
   * @param userId - User ID
   */
  async logout(userId: string) {
    await this.userRepository.incrementTokenVersion(userId);
  }

  /**
   * Get user by ID
   * @param userId - User ID
   * @returns Promise<{ id: string, email: string, name: string }> - User data
   */
  async getUserById(userId: string) {
    const user = await this.userRepository.getUserById(userId);
    if (!user) {
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
      logger.error("Error generating tokens", error);
      throw new Error("Failed to generate tokens");
    }
  }
}
