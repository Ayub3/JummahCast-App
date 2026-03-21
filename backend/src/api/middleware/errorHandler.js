import { ValidationError } from '../../domain/errors/ValidationError.js';
import { NotFoundError } from '../../domain/errors/NotFoundError.js';
import { UnauthorizedError } from '../../domain/errors/UnauthorizedError.js';
import { ForbiddenError } from '../../domain/errors/ForbiddenError.js';

/**
 * Centralized Error Handler Middleware
 * Catches all errors and formats consistent response
 */
export function errorHandler(err, req, res, next) {
  // Log error for debugging
  console.error('Error:', {
    name: err.name,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // Default error response
  let statusCode = 500;
  let message = 'Internal server error';
  let errors = undefined;

  // Handle known error types
  if (err instanceof ValidationError) {
    statusCode = 400;
    message = err.message;
  } else if (err instanceof NotFoundError) {
    statusCode = 404;
    message = err.message;
  } else if (err instanceof UnauthorizedError) {
    statusCode = 401;
    message = err.message;
  } else if (err instanceof ForbiddenError) {
    statusCode = 403;
    message = err.message;
  } else if (err.statusCode) {
    // Custom status code
    statusCode = err.statusCode;
    message = err.message;
  }

  // Zod validation errors
  if (err.name === 'ZodError') {
    statusCode = 400;
    message = 'Validation failed';
    errors = err.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message,
    }));
  }

  // Multer file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 400;
    message = 'File too large';
  }

  // Don't expose internal errors in production
  if (statusCode === 500 && process.env.NODE_ENV === 'production') {
    message = 'Internal server error';
  }

  res.status(statusCode).json({
    error: message,
    ...(errors && { errors }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

/**
 * 404 Not Found Handler
 * Catches all unmatched routes
 */
export function notFoundHandler(req, res) {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
  });
}

/**
 * Async Error Wrapper
 * Wraps async route handlers to catch errors
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
