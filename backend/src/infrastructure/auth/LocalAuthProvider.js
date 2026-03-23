import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';
import { AuthProvider } from './AuthProvider.js';
import { UnauthorizedError } from '../../domain/errors/UnauthorizedError.js';
import { ValidationError } from '../../domain/errors/ValidationError.js';
import { User } from '../../domain/User.js';

/**
 * Local Authentication Provider
 * JWT-based auth with bcrypt password hashing for development/self-hosted environments
 * Uses SQLite database for user persistence
 * 
 * NOTE: In production with AWS Cognito, this provider is NOT used.
 * Cognito handles: signup, login, password reset, social login via Hosted UI
 */
export class LocalAuthProvider extends AuthProvider {
  constructor(userRepository, secret = 'local-dev-secret-change-in-production') {
    super();
    this.userRepository = userRepository;
    this.secret = secret;
    this.tokenExpiry = '24h';
    this.saltRounds = 10;
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
        mosque: decoded.mosque || null,
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

    // Find user by email
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Verify password using bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Generate JWT
    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles,
        mosque: user.mosque,
      },
      this.secret,
      { expiresIn: this.tokenExpiry }
    );

    return {
      token,
      user: user.toJSON(),
    };
  }

  /**
   * Signup new user
   * @param {Object} userData - { email, password, name, roles?, mosque? }
   * @returns {Promise<Object>} { token, user }
   */
  async signup(userData) {
    const { email, password, name, roles = ['user'], mosque = null } = userData;

    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new ValidationError('Email already registered');
    }

    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(password, this.saltRounds);

    // Create user domain object
    const user = new User({
      id: nanoid(),
      email,
      password: hashedPassword,
      name,
      roles,
      mosque,
    });

    // Validate user data
    user.validate();

    // Save user to database
    await this.userRepository.create(user);

    // Generate JWT
    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles,
        mosque: user.mosque,
      },
      this.secret,
      { expiresIn: this.tokenExpiry }
    );

    return {
      token,
      user: user.toJSON(),
    };
  }

  /**
   * Request password reset
   * Generates a reset token and stores it in database
   * 
   * LOCAL BEHAVIOR: Mocks email sending, returns token for testing
   * COGNITO BEHAVIOR: Cognito sends email via AWS SES, no return value
   * 
   * @param {string} email - User email
   * @returns {Promise<Object>} { message, token? (local only) }
   */
  async requestPasswordReset(email) {
    // Find user by email
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      // Don't reveal if email exists (security best practice)
      return {
        message: 'If the email exists, a password reset link has been sent',
      };
    }

    // Generate reset token
    const resetToken = nanoid(32);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store token in database
    await this.userRepository.createPasswordResetToken(
      email,
      resetToken,
      expiresAt
    );

    // LOCAL: Return token for testing (in production, send email)
    // COGNITO: AWS Cognito sends email automatically via SES
    console.log('🔐 Password reset token (LOCAL DEV ONLY):', resetToken);
    console.log('🔐 Expires at:', expiresAt.toISOString());

    return {
      message: 'If the email exists, a password reset link has been sent',
      token: resetToken, // Only for local testing!
    };
  }

  /**
   * Reset password using token
   * @param {string} token - Reset token
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} { message }
   */
  async resetPassword(token, newPassword) {
    // Find reset token
    const resetToken = await this.userRepository.findPasswordResetToken(token);

    if (!resetToken) {
      throw new ValidationError('Invalid or expired reset token');
    }

    // Check if token is used
    if (resetToken.used) {
      throw new ValidationError('Reset token has already been used');
    }

    // Check if token is expired
    const now = new Date();
    const expiresAt = new Date(resetToken.expiresAt);
    if (now > expiresAt) {
      throw new ValidationError('Reset token has expired');
    }

    // Find user by email
    const user = await this.userRepository.findByEmail(resetToken.email);
    if (!user) {
      throw new ValidationError('User not found');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, this.saltRounds);

    // Update user password
    await this.userRepository.update(user.id, {
      password: hashedPassword,
    });

    // Mark token as used
    await this.userRepository.markPasswordResetTokenAsUsed(token);

    return {
      message: 'Password has been reset successfully',
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

  /**
   * Clean up expired password reset tokens
   * Should be called periodically (e.g., via cron job)
   */
  async cleanupExpiredTokens() {
    await this.userRepository.deleteExpiredPasswordResetTokens();
  }
}
