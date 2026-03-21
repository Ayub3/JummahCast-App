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
}
