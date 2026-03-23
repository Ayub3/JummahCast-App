import { z } from 'zod';
import { ValidationError } from '../../domain/errors/ValidationError.js';

/**
 * Request Validation Middleware using Zod schemas
 * Note: Express 5 makes req.query, req.body, req.params read-only
 * We validate but don't reassign
 */
export function validateRequest(schema) {
  return (req, res, next) => {
    try {
      // Validate the request data
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // If validation passes, continue
      // Note: We don't reassign req.body/query/params as they're read-only in Express 5
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
        return next(new ValidationError(messages.join(', ')));
      }
      next(error);
    }
  };
}

/**
 * Input Sanitization Middleware
 * Strips dangerous characters from strings
 * Note: In Express 5, we can't reassign req.body/query, so we sanitize in-place
 */
export function sanitizeInput(req, res, next) {
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      // Remove potential XSS vectors
      return obj.trim().replace(/<script[^>]*>.*?<\/script>/gi, '');
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    if (obj && typeof obj === 'object') {
      // Sanitize object properties in-place
      for (const [key, value] of Object.entries(obj)) {
        obj[key] = sanitize(value);
      }
      return obj;
    }
    return obj;
  };

  // Sanitize in-place (Express 5 compatible)
  if (req.body && typeof req.body === 'object') {
    sanitize(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    sanitize(req.query);
  }

  next();
}

/**
 * Common validation schemas
 */
export const schemas = {
  sermon: {
    create: z.object({
      body: z.object({
        title: z.string().min(1).max(200),
        speaker: z.string().min(1).max(100),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
        description: z.string().max(1000).optional(),
      }),
    }),

    list: z.object({
      query: z.object({
        q: z.string().max(100).optional(),
        speaker: z.string().max(100).optional(),
        mosque: z.string().max(200).optional(),
        sort: z.enum(['date_desc', 'date_asc', 'title_asc', 'title_desc']).optional(),
      }),
    }),

    get: z.object({
      params: z.object({
        id: z.string().min(1),
      }),
    }),
  },

  auth: {
    login: z.object({
      body: z.object({
        email: z.string().email(),
        password: z.string().min(6),
      }),
    }),

    signup: z.object({
      body: z.object({
        email: z.string().email(),
        password: z.string().min(8, 'Password must be at least 8 characters'),
        name: z.string().min(2).max(100),
        mosque: z.string().min(2).max(200).optional(),
      }),
    }),

    forgotPassword: z.object({
      body: z.object({
        email: z.string().email(),
      }),
    }),

    resetPassword: z.object({
      body: z.object({
        token: z.string().min(1),
        // Accept both 'password' and 'newPassword' for compatibility
        password: z.string().min(8, 'Password must be at least 8 characters').optional(),
        newPassword: z.string().min(8, 'Password must be at least 8 characters').optional(),
      }).refine(
        data => data.password || data.newPassword,
        { message: 'password is required', path: ['password'] }
      ),
    }),
  },
};
