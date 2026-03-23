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
   * Signup new user
   * Only used for local auth (Cognito handles this client-side)
   */
  async signup(userData) {
    return this.authProvider.signup(userData);
  }

  /**
   * Request password reset
   * Only used for local auth (Cognito handles this client-side)
   */
  async requestPasswordReset(email) {
    return this.authProvider.requestPasswordReset(email);
  }

  /**
   * Reset password with token
   * Only used for local auth (Cognito handles this client-side)
   */
  async resetPassword(token, newPassword) {
    return this.authProvider.resetPassword(token, newPassword);
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
