import { ValidationError } from './errors/ValidationError.js';

/**
 * User Domain Model
 * Represents a user in the system with validation and business rules
 */
export class User {
  constructor({
    id,
    email,
    password, // hashed password
    name,
    roles = ['user'],
    mosque = null, // nullable, only for admin users
    createdAt = new Date().toISOString(),
    updatedAt = new Date().toISOString(),
  }) {
    this.id = id;
    this.email = email;
    this.password = password;
    this.name = name;
    this.roles = roles;
    this.mosque = mosque;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * Validate user data
   * @throws {ValidationError} if validation fails
   */
  validate() {
    const errors = [];

    if (!this.email || !this.isValidEmail(this.email)) {
      errors.push('Invalid email address');
    }

    if (!this.name || this.name.trim().length < 2) {
      errors.push('Name must be at least 2 characters');
    }

    if (!this.password || this.password.length < 6) {
      errors.push('Password must be at least 6 characters');
    }

    if (!Array.isArray(this.roles) || this.roles.length === 0) {
      errors.push('User must have at least one role');
    }

    // Warn but don't block – mosque can be assigned later or via Cognito
    if (this.roles.includes('admin') && !this.mosque) {
      console.warn(`⚠️  Admin user ${this.email} created without mosque assignment`);
    }

    if (errors.length > 0) {
      throw new ValidationError(errors.join(', '));
    }
  }

  /**
   * Check if email is valid
   * @param {string} email
   * @returns {boolean}
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Check if user has a specific role
   * @param {string} role
   * @returns {boolean}
   */
  hasRole(role) {
    return this.roles.includes(role);
  }

  /**
   * Check if user is admin
   * @returns {boolean}
   */
  isAdmin() {
    return this.hasRole('admin');
  }

  /**
   * Convert to JSON (exclude sensitive fields)
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      roles: this.roles,
      mosque: this.mosque,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Create a user from database row
   * @param {Object} row - Database row
   * @returns {User}
   */
  static fromDbRow(row) {
    return new User({
      id: row.id,
      email: row.email,
      password: row.password,
      name: row.name,
      roles: JSON.parse(row.roles || '["user"]'),
      mosque: row.mosque,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  /**
   * Convert to database row format
   * @returns {Object}
   */
  toDbRow() {
    return {
      id: this.id,
      email: this.email,
      password: this.password,
      name: this.name,
      roles: JSON.stringify(this.roles),
      mosque: this.mosque,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
