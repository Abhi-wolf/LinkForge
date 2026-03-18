import User, { IUser } from "../models/user.model";

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

  async incrementTokenVersion(id: string): Promise<void> {
    await User.findByIdAndUpdate(id, { $inc: { tokenVersion: 1 } });
  }

  async getUserById(id: string): Promise<IUser | null> {
    return await User.findById(id);
  }
}
