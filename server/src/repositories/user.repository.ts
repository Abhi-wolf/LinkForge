import User, { type IUser } from "../models/user.model";
import { generateVerificationToken, generateResetToken } from "../utils/email.utils";

export class UserRepository {
  async create(data: Partial<IUser>): Promise<IUser> {
    return await User.create(data);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return await User.findOne({ email: email.toLowerCase() });
  }

  async findById(id: string): Promise<IUser | null> {
    return await User.findById(id);
  }

  async findByEmailVerificationToken(token: string): Promise<IUser | null> {
    return await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() },
    });
  }

  async findByPasswordResetToken(token: string): Promise<IUser | null> {
    return await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() },
    });
  }

  async setEmailVerificationToken(userId: string): Promise<string> {
    const token = generateVerificationToken();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await User.findByIdAndUpdate(userId, {
      emailVerificationToken: token,
      emailVerificationExpires: expires,
    });

    return token;
  }

  async setPasswordResetToken(userId: string): Promise<string> {
    const token = generateResetToken();
    const expires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    await User.findByIdAndUpdate(userId, {
      passwordResetToken: token,
      passwordResetExpires: expires,
    });

    return token;
  }

  async verifyEmail(userId: string): Promise<IUser | null> {
    return await User.findByIdAndUpdate(
      userId,
      {
        emailVerified: true,
        $unset: {
          emailVerificationToken: 1,
          emailVerificationExpires: 1,
        },
      },
      { new: true }
    );
  }

  async clearPasswordResetToken(userId: string): Promise<IUser | null> {
    return await User.findByIdAndUpdate(
      userId,
      {
        $unset: {
          passwordResetToken: 1,
          passwordResetExpires: 1,
        },
      },
      { new: true }
    );
  }

  async incrementTokenVersion(id: string): Promise<IUser | null> {
    return await User.findByIdAndUpdate(
      id,
      { $inc: { tokenVersion: 1 } },
      { new: true }
    );
  }

  async getUserById(id: string): Promise<IUser | null> {
    return await User.findById(id);
  }

  async update(id: string, data: Partial<IUser>): Promise<IUser | null> {
    return await User.findByIdAndUpdate(id, data, { new: true });
  }
}
