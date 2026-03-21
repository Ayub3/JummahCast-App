import express from 'express';
import multer from 'multer';
import { createAuthMiddleware, requireRole } from '../middleware/auth.js';
import { validateRequest, schemas } from '../middleware/validator.js';
import { rateLimiters } from '../middleware/rateLimiter.js';

/**
 * Admin Routes
 * Protected endpoints requiring authentication
 */
export function createAdminRoutes(adminController, authProvider) {
  const router = express.Router();

  // Multer configuration
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 200 * 1024 * 1024 }, // 200MB
    fileFilter: (_req, file, cb) => {
      if (!file.mimetype.startsWith('audio/')) {
        return cb(new Error('Only audio files allowed'));
      }
      cb(null, true);
    },
  });

  // All admin routes require authentication
  router.use(createAuthMiddleware(authProvider));
  router.use(requireRole(authProvider, 'admin'));

  // Upload sermon
  router.post(
    '/upload',
    rateLimiters.upload,
    upload.single('file'),
    validateRequest(schemas.sermon.create),
    adminController.uploadSermon
  );

  return router;
}
