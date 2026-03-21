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
