import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * Auth Controller
 * Handles authentication endpoints
 */
export class AuthController {
  constructor(authService) {
    this.authService = authService;
  }

  /**
   * POST /api/auth/login
   * Login user (Local auth only - Cognito uses hosted UI)
   */
  login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const result = await this.authService.login({ email, password });

    res.json({
      ok: true,
      token: result.token,
      user: result.user,
    });
  });

  /**
   * POST /api/auth/signup
   * Signup new user (Local auth only - Cognito uses hosted UI)
   */
  signup = asyncHandler(async (req, res) => {
    const { email, password, name, mosque } = req.body;

    const result = await this.authService.signup({
      email,
      password,
      name,
      roles: mosque ? ['admin'] : ['user'], // Admin if mosque provided
      mosque,
    });

    res.status(201).json({
      ok: true,
      token: result.token,
      user: result.user,
    });
  });

  /**
   * POST /api/auth/forgot-password
   * Request password reset (Local auth only - Cognito uses hosted UI)
   */
  forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    const result = await this.authService.requestPasswordReset(email);

    res.json({
      ok: true,
      message: result.message,
      // Include token in local dev only for testing
      ...(result.token && { token: result.token }),
    });
  });

  /**
   * POST /api/auth/reset-password
   * Reset password with token (Local auth only - Cognito uses hosted UI)
   */
  resetPassword = asyncHandler(async (req, res) => {
    const { token } = req.body;
    // Accept both field names for forward/backward compat
    const newPassword = req.body.newPassword || req.body.password;

    const result = await this.authService.resetPassword(token, newPassword);

    res.json({
      ok: true,
      message: result.message,
    });
  });

  /**
   * GET /api/auth/me
   * Get current user info
   */
  getCurrentUser = asyncHandler(async (req, res) => {
    res.json({
      ok: true,
      user: req.user,
    });
  });
}
