/**
 * Authentication Provider Interface
 * All auth providers must implement these methods
 */
export class AuthProvider {
  async validateToken(token) {
    throw new Error('validateToken() must be implemented');
  }

  async getUserFromToken(token) {
    throw new Error('getUserFromToken() must be implemented');
  }

  async login(credentials) {
    throw new Error('login() must be implemented');
  }

  async signup(userData) {
    throw new Error('signup() must be implemented');
  }

  async requestPasswordReset(email) {
    throw new Error('requestPasswordReset() must be implemented');
  }

  async resetPassword(token, newPassword) {
    throw new Error('resetPassword() must be implemented');
  }
}
