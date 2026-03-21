/**
 * Authentication Service
 * Handles user authentication logic
 */
export class AuthService {
  constructor(authProvider) {
    this.authProvider = authProvider;
  }

  /**
   * Login user
   * Only used for local auth (Cognito handles this client-side)
   */
  async login(credentials) {
    return this.authProvider.login(credentials);
  }

  /**
   * Validate token
   */
  async validateToken(token) {
    return this.authProvider.validateToken(token);
  }

  /**
   * Get user from token
   */
  async getUserFromToken(token) {
    return this.authProvider.getUserFromToken(token);
  }
}
