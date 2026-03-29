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

    // Any user in the Admins group gets the admin role.
    // All other authenticated users default to 'user' — no group required.
    if (groups.includes('Admins')) {
      return ['admin'];
    }

    return ['user'];
  }

  /**
   * Login is handled by Cognito Hosted UI or SDK
   * This method is not used server-side
   */
  async login() {
    throw new Error('Login must be handled by Cognito Hosted UI or AWS SDK on client side');
  }

  /**
   * Signup is handled by Cognito Hosted UI or SDK
   * Cognito provides built-in signup with email verification, password policies, etc.
   * 
   * For client-side signup:
   * - Use AWS Amplify: Auth.signUp(username, password, { attributes })
   * - Use Cognito Hosted UI: redirect to /signup endpoint
   * - Use AWS SDK: CognitoIdentityProvider.signUp()
   * 
   * This server-side method is NOT used with Cognito
   */
  async signup() {
    throw new Error('Signup must be handled by Cognito Hosted UI or AWS SDK on client side');
  }

  /**
   * Password reset is handled by Cognito
   * Cognito sends verification email via AWS SES automatically
   * 
   * For client-side password reset:
   * - Use AWS Amplify: Auth.forgotPassword(username)
   * - Use Cognito Hosted UI: redirect to /forgot-password endpoint
   * - Use AWS SDK: CognitoIdentityProvider.forgotPassword()
   * 
   * This server-side method is NOT used with Cognito
   */
  async requestPasswordReset() {
    throw new Error('Password reset must be handled by Cognito Hosted UI or AWS SDK on client side');
  }

  /**
   * Password reset confirmation is handled by Cognito
   * User receives code via email, then confirms with code + new password
   * 
   * For client-side reset confirmation:
   * - Use AWS Amplify: Auth.forgotPasswordSubmit(username, code, newPassword)
   * - Use AWS SDK: CognitoIdentityProvider.confirmForgotPassword()
   * 
   * This server-side method is NOT used with Cognito
   */
  async resetPassword() {
    throw new Error('Password reset confirmation must be handled by AWS SDK on client side');
  }

  /**
   * Social login is configured via Cognito Hosted UI
   * Setup instructions:
   * 
   * 1. In AWS Cognito Console:
   *    - Go to App Integration > Domain
   *    - Create a Cognito domain (e.g., jummahcast.auth.us-east-1.amazoncognito.com)
   * 
   * 2. Configure Identity Providers:
   *    - App Integration > Identity Providers
   *    - Add Google, Facebook, Apple, or SAML providers
   *    - Enter OAuth credentials from provider
   * 
   * 3. Configure App Client:
   *    - App Integration > App clients
   *    - Enable Cognito Hosted UI
   *    - Add callback URLs (e.g., https://yourdomain.com/auth/callback)
   *    - Enable OAuth scopes: email, openid, profile
   * 
   * 4. Client-side redirect:
   *    window.location.href = `https://${cognitoDomain}/oauth2/authorize?
   *      client_id=${clientId}&
   *      response_type=code&
   *      scope=email+openid+profile&
   *      redirect_uri=${callbackUrl}`
   * 
   * 5. Handle callback on your domain:
   *    - Extract code from URL
   *    - Exchange code for tokens via /oauth2/token endpoint
   *    - Verify ID token using this provider
   */
  // No separate method needed - documented for reference

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
