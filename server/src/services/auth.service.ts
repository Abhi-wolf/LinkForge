import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { serverConfig } from "../config";
import { UserRepository } from "../repositories/user.repository";
import {
  ConflictError,
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
        appName: "LinkForge",
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
      appName: "LinkForge",
    });

    return { message: "Verification email sent" };
  }

  async verifyEmail(token: string) {
    const user = await this.userRepository.findByEmailVerificationToken(token);
    if (!user) {
      throw new UnauthorizedError("Invalid or expired verification token");
    }

    await this.userRepository.verifyEmail(user._id.toString());

    return { message: "Email verified successfully" };
  }

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
      appName: "LinkForge",
      expiryMinutes: 30,
    });

    return {
      message:
        "If an account exists with this email, a password reset link has been sent",
    };
  }

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
        appName: "LinkForge",
      });
    } catch (error) {
      logger.error("Failed to send password reset confirmation email", error);
    }

    return { message: "Password reset successfully" };
  }

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
      throw new UnauthorizedError(
        "Please verify your email before logging in. Check your inbox for the verification email.",
      );
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

  async refreshTokens(refreshToken: string) {
    try {
      const decoded: any = jwt.verify(
        refreshToken,
        serverConfig.JWT_REFRESH_SECRET,
      );

      logger.info(`Refresh token decoded = ${JSON.stringify(decoded)}`);

      const user = await this.userRepository.findById(decoded.userId);

      logger.info(`Got user from repository ${JSON.stringify(user)}`);

      if (!user || user.tokenVersion !== decoded.tokenVersion) {
        throw new UnauthorizedError("Invalid refresh token");
      }

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

  async logout(userId: string) {
    await this.userRepository.incrementTokenVersion(userId);
  }

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
