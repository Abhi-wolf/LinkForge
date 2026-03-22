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

export class AuthService {
  constructor(private readonly userRepository: UserRepository) { }

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

    const tokens = this.generateTokens(user);
    return {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
      ...tokens,
    };
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

    const tokens = this.generateTokens(user);
    return {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
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
      data.password = hashedPassword
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

      const updatedUser = await this.userRepository.incrementTokenVersion(decoded.userId);

      logger.info(`Incremented token version for user ${decoded.userId}`);

      if (!updatedUser) {
        throw new UnauthorizedError("User no longer exists");
      }

      const tokens = this.generateTokens(updatedUser);

      logger.info(`Generated new tokens for user ${updatedUser._id}`);

      return {
        userId: updatedUser._id?.toString(),
        ...tokens
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
