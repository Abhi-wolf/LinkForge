import { UserRepository } from "../repositories/user.repository";
import { AuthService } from "../services/auth.service";

export class AuthFactory {
  private static userRepository: UserRepository;
  private static authService: AuthService;

  static getUserRepository(): UserRepository {
    if (!this.userRepository) {
      this.userRepository = new UserRepository();
    }
    return this.userRepository;
  }

  static getAuthService(): AuthService {
    if (!this.userRepository) {
      this.authService = new AuthService(this.getUserRepository());
    }
    return this.authService;
  }
}
