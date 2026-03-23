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

  // Signup – uses its own lenient limiter (not the strict login one)
  router.post(
    '/signup',
    rateLimiters.signup,
    validateRequest(schemas.auth.signup),
    authController.signup
  );

  // Login – strict rate limit to prevent brute force
  router.post(
    '/login',
    rateLimiters.auth,
    validateRequest(schemas.auth.login),
    authController.login
  );

  // Forgot password – lenient, users may retry
  router.post(
    '/forgot-password',
    rateLimiters.forgotPassword,
    validateRequest(schemas.auth.forgotPassword),
    authController.forgotPassword
  );

  // Reset password – lenient, token itself is the security
  router.post(
    '/reset-password',
    rateLimiters.forgotPassword,
    validateRequest(schemas.auth.resetPassword),
    authController.resetPassword
  );

  // Get current user (requires auth)
  router.get(
    '/me',
    createAuthMiddleware(authProvider),
    authController.getCurrentUser
  );

  return router;
}
