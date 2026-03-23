import { User } from '../domain/User.js';
import { NotFoundError } from '../domain/errors/NotFoundError.js';

/**
 * User Repository
 * Handles user data persistence using the DB adapter pattern
 */
export class UserRepository {
  constructor(dbAdapter) {
    this.db = dbAdapter;
  }

  /**
   * Create a new user
   * @param {User} user - User domain object
   * @returns {Promise<User>}
   */
  async create(user) {
    const dbRow = user.toDbRow();
    await this.db.insertUser(dbRow);
    return user;
  }

  /**
   * Find user by email
   * @param {string} email
   * @returns {Promise<User|null>}
   */
  async findByEmail(email) {
    const row = await this.db.getUserByEmail(email);
    if (!row) return null;
    return User.fromDbRow(row);
  }

  /**
   * Find user by ID
   * @param {string} id
   * @returns {Promise<User|null>}
   */
  async findById(id) {
    const row = await this.db.getUserById(id);
    if (!row) return null;
    return User.fromDbRow(row);
  }

  /**
   * Update user by ID
   * @param {string} id
   * @param {Object} data - Partial user data to update
   * @returns {Promise<User>}
   */
  async update(id, data) {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Update user properties
    const updatedData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    await this.db.updateUser(id, updatedData);

    // Return updated user
    return await this.findById(id);
  }

  /**
   * Delete user by ID
   * @param {string} id
   * @returns {Promise<void>}
   */
  async delete(id) {
    await this.db.deleteUser(id);
  }

  /**
   * List all users (admin only)
   * @param {Object} options - Query options
   * @returns {Promise<User[]>}
   */
  async list(options = {}) {
    const rows = await this.db.listUsers(options);
    return rows.map(row => User.fromDbRow(row));
  }

  /**
   * Create a password reset token
   * @param {string} email
   * @param {string} token
   * @param {Date} expiresAt
   * @returns {Promise<void>}
   */
  async createPasswordResetToken(email, token, expiresAt) {
    await this.db.insertPasswordResetToken({
      email,
      token,
      expiresAt: expiresAt.toISOString(),
      used: false,
    });
  }

  /**
   * Find password reset token
   * @param {string} token
   * @returns {Promise<Object|null>}
   */
  async findPasswordResetToken(token) {
    return await this.db.getPasswordResetToken(token);
  }

  /**
   * Mark password reset token as used
   * @param {string} token
   * @returns {Promise<void>}
   */
  async markPasswordResetTokenAsUsed(token) {
    await this.db.updatePasswordResetToken(token, { used: true });
  }

  /**
   * Delete expired password reset tokens
   * @returns {Promise<void>}
   */
  async deleteExpiredPasswordResetTokens() {
    await this.db.deleteExpiredPasswordResetTokens();
  }
}
