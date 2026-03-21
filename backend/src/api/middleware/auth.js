import { UnauthorizedError } from '../../domain/errors/UnauthorizedError.js';
import { ForbiddenError } from '../../domain/errors/ForbiddenError.js';

/**
 * Authentication Middleware
 * Validates JWT token and attaches user to request
 */
export function createAuthMiddleware(authProvider) {
  return async function authenticate(req, res, next) {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedError('No token provided');
      }

      const token = authHeader.substring(7); // Remove 'Bearer '

      const isValid = await authProvider.validateToken(token);
      if (!isValid) {
        throw new UnauthorizedError('Invalid token');
      }

      const user = await authProvider.getUserFromToken(token);
      req.user = user;

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Role-based Authorization Middleware
 * Checks if user has required role
 */
export function requireRole(authProvider, role) {
  return function authorize(req, res, next) {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      if (!authProvider.hasRole(req.user, role)) {
        throw new ForbiddenError(`Requires ${role} role`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Optional Authentication Middleware
 * Attaches user if token present, but doesn't fail if missing
 */
export function createOptionalAuthMiddleware(authProvider) {
  return async function optionalAuth(req, res, next) {
    try {
      const authHeader = req.headers.authorization;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const isValid = await authProvider.validateToken(token);

        if (isValid) {
          const user = await authProvider.getUserFromToken(token);
          req.user = user;
        }
      }
    } catch {
      // Silently fail for optional auth
    }

    next();
  };
}
