import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { AuthProvider } from './AuthProvider.js';
import { UnauthorizedError } from '../../domain/errors/UnauthorizedError.js';

/**
 * AWS Cognito Authentication Provider
 * Production-ready authentication using AWS Cognito
 * Validates JWT tokens issued by Cognito
 */
export class CognitoAuthProvider extends AuthProvider {
  constructor(config) {
    super();
    
    if (!config.userPoolId || !config.clientId || !config.region) {
      throw new Error('Cognito configuration incomplete: userPoolId, clientId, and region are required');
    }

    this.userPoolId = config.userPoolId;
    this.clientId = config.clientId;
    this.region = config.region;

    // Create JWT verifier for access tokens
    this.verifier = CognitoJwtVerifier.create({
      userPoolId: this.userPoolId,
      tokenUse: 'access',
      clientId: this.clientId,
    });

    // ID token verifier (contains user attributes)
    this.idTokenVerifier = CognitoJwtVerifier.create({
      userPoolId: this.userPoolId,
      tokenUse: 'id',
      clientId: this.clientId,
    });
  }

  /**
   * Validate Cognito JWT token
   * @param {string} token - JWT access token from Cognito
   * @returns {Promise<boolean>}
   */
  async validateToken(token) {
    try {
      await this.verifier.verify(token);
      return true;
    } catch (error) {
      console.error('Token validation failed:', error.message);
      return false;
    }
  }

  /**
   * Extract user information from Cognito token
   * @param {string} token - JWT token (ID token preferred for user info)
   * @returns {Promise<Object>} User object
   */
  async getUserFromToken(token) {
    try {
      // Try ID token first (has more user info)
      let payload;
      try {
        payload = await this.idTokenVerifier.verify(token);
      } catch {
        // Fallback to access token
        payload = await this.verifier.verify(token);
      }

      return {
        id: payload.sub,
        email: payload.email,
        name: payload.name || payload.email,
        roles: this.extractRoles(payload),
        username: payload['cognito:username'],
        groups: payload['cognito:groups'] || [],
      };
    } catch (error) {
      throw new UnauthorizedError('Invalid or expired token');
    }
  }

  /**
   * Extract roles from Cognito groups
   * Maps Cognito groups to application roles
   * @param {Object} payload - Decoded JWT payload
   * @returns {Array<string>} Roles
   */
  extractRoles(payload) {
    const groups = payload['cognito:groups'] || [];
    
    // Map Cognito groups to application roles
    const roleMapping = {
      'Admins': 'admin',
      'Users': 'user',
      'Moderators': 'moderator',
    };

    return groups.map(group => roleMapping[group] || 'user').filter(Boolean);
  }

  /**
   * Login is handled by Cognito Hosted UI or SDK
   * This method is not used server-side
   */
  async login() {
    throw new Error('Login must be handled by Cognito Hosted UI or AWS SDK on client side');
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
