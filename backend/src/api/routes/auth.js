import express from 'express';
import { createAuthMiddleware } from '../middleware/auth.js';
import { validateRequest, schemas } from '../middleware/validator.js';
import { rateLimiters } from '../middleware/rateLimiter.js';

/**
 * Auth Routes
 * Authentication endpoints
 */
export function createAuthRoutes(authController, authProvider) {
  const router = express.Router();

  // Login (local auth only)
  router.post(
    '/login',
    rateLimiters.auth,
    validateRequest(schemas.auth.login),
    authController.login
  );

  // Get current user (requires auth)
  router.get(
    '/me',
    createAuthMiddleware(authProvider),
    authController.getCurrentUser
  );

  return router;
}
