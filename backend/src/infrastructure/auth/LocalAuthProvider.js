import jwt from 'jsonwebtoken';
import { AuthProvider } from './AuthProvider.js';
import { UnauthorizedError } from '../../domain/errors/UnauthorizedError.js';

/**
 * Local Authentication Provider
 * Simple JWT-based auth for development environment
 * NO external dependencies (AWS, etc.)
 */
export class LocalAuthProvider extends AuthProvider {
  constructor(secret = 'local-dev-secret-change-in-production') {
    super();
    this.secret = secret;
    this.tokenExpiry = '24h';
    
    // In-memory user store (for dev only)
    this.users = [
      {
        id: 'admin-001',
        email: 'admin@jummahcast.local',
        password: 'admin123', // In real app, use bcrypt
        name: 'Admin User',
        roles: ['admin']
      },
      {
        id: 'user-001',
        email: 'user@jummahcast.local',
        password: 'user123',
        name: 'Regular User',
        roles: ['user']
      }
    ];
  }

  /**
   * Validate JWT token
   * @param {string} token - JWT token
   * @returns {Promise<boolean>}
   */
  async validateToken(token) {
    try {
      jwt.verify(token, this.secret);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Extract user information from token
   * @param {string} token - JWT token
   * @returns {Promise<Object>} User object
   */
  async getUserFromToken(token) {
    try {
      const decoded = jwt.verify(token, this.secret);
      return {
        id: decoded.sub,
        email: decoded.email,
        name: decoded.name,
        roles: decoded.roles || [],
      };
    } catch (error) {
      throw new UnauthorizedError('Invalid token');
    }
  }

  /**
   * Login user and generate JWT token
   * @param {Object} credentials - { email, password }
   * @returns {Promise<Object>} { token, user }
   */
  async login(credentials) {
    const { email, password } = credentials;

    // Find user (INSECURE: Only for local dev!)
    const user = this.users.find(
      u => u.email === email && u.password === password
    );

    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Generate JWT
    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles,
      },
      this.secret,
      { expiresIn: this.tokenExpiry }
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles,
      },
    };
  }

  /**
   * Verify user has required role
   * @param {Object} user - User object
   * @param {string} requiredRole - Role to check
   * @returns {boolean}
   */
  hasRole(user, requiredRole) {
    return user.roles && user.roles.includes(requiredRole);
  }
}
