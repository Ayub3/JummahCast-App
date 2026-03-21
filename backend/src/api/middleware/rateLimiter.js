/**
 * Simple in-memory rate limiter (for development)
 * In production, use Redis-based rate limiting
 */
class RateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes
    this.max = options.max || 100;
    this.message = options.message || 'Too many requests';
    this.keyGenerator = options.keyGenerator || ((req) => req.ip);
    this.skip = options.skip || (() => false);
    
    this.requests = new Map();
  }

  middleware() {
    return (req, res, next) => {
      if (this.skip(req)) {
        return next();
      }

      const key = this.keyGenerator(req);
      const now = Date.now();
      
      // Clean up old entries
      if (this.requests.has(key)) {
        const times = this.requests.get(key).filter(time => now - time < this.windowMs);
        this.requests.set(key, times);
      } else {
        this.requests.set(key, []);
      }

      const times = this.requests.get(key);

      if (times.length >= this.max) {
        return res.status(429).json({
          error: this.message,
          retryAfter: Math.ceil((times[0] + this.windowMs - now) / 1000),
        });
      }

      times.push(now);
      this.requests.set(key, times);

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', this.max);
      res.setHeader('X-RateLimit-Remaining', this.max - times.length);
      res.setHeader('X-RateLimit-Reset', new Date(now + this.windowMs).toISOString());

      next();
    };
  }
}

/**
 * Create rate limiter middleware
 */
export function createRateLimiter(options) {
  const limiter = new RateLimiter(options);
  return limiter.middleware();
}

/**
 * Predefined rate limiters
 */
export const rateLimiters = {
  // General API rate limit
  global: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: 'Too many requests from this IP',
  }),

  // Strict limiter for auth endpoints
  auth: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many login attempts',
  }),

  // Upload rate limit (per authenticated user)
  upload: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    message: 'Upload limit exceeded',
    keyGenerator: (req) => req.user?.id || req.ip,
  }),
};
