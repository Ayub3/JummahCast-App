import express from 'express';
import cors from 'cors';
import { getConfig } from './infrastructure/config.js';
import { createDbAdapter } from '../adapters/db/index.js';
import { createBlobAdapter } from '../adapters/blob/index.js';
import { createAuthProvider } from './infrastructure/auth/index.js';

// Services
import { SermonRepository } from './repositories/SermonRepository.js';
import { UserRepository } from './repositories/UserRepository.js';
import { SermonService } from './services/SermonService.js';
import { UploadService } from './services/UploadService.js';
import { AuthService } from './services/AuthService.js';

// Controllers
import { SermonController } from './api/controllers/SermonController.js';
import { AdminController } from './api/controllers/AdminController.js';
import { AuthController } from './api/controllers/AuthController.js';

// Routes
import { createSermonRoutes, createSpeakerRoutes, createMosqueRoutes } from './api/routes/sermons.js';
import { createAdminRoutes } from './api/routes/admin.js';
import { createAuthRoutes } from './api/routes/auth.js';

// Middleware
import { errorHandler, notFoundHandler } from './api/middleware/errorHandler.js';
import { sanitizeInput } from './api/middleware/validator.js';
import { rateLimiters } from './api/middleware/rateLimiter.js';

/**
 * Create Express Application
 * Dependency Injection and Layered Architecture
 */
export function createApp() {
  const app = express();
  const config = getConfig();

  // ========================================
  // DEPENDENCY INJECTION
  // ========================================

  // Infrastructure
  const db = createDbAdapter(config);
  const blob = createBlobAdapter(config);
  
  // Repositories
  const sermonRepository = new SermonRepository(db);
  const userRepository = new UserRepository(db);
  
  // Auth Provider (needs userRepository for local auth)
  const authProvider = createAuthProvider(config, userRepository);

  // Services
  const sermonService = new SermonService(sermonRepository);
  const uploadService = new UploadService(sermonRepository, blob);
  const authService = new AuthService(authProvider);

  // Controllers
  const sermonController = new SermonController(sermonService, blob);
  const adminController = new AdminController(uploadService);
  const authController = new AuthController(authService);

  // ========================================
  // MIDDLEWARE
  // ========================================

  // CORS
  app.use(
    cors({
      origin: config.CORS_ALLOWED_ORIGINS,
      credentials: true,
    })
  );

  // Body parsers
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Input sanitization
  app.use(sanitizeInput);

  // Global rate limiting
  app.use('/api', rateLimiters.global);

  // ========================================
  // ROUTES
  // ========================================

  // Health check
  app.get('/health', (req, res) => {
    res.json({
      ok: true,
      timestamp: new Date().toISOString(),
      env: config.NODE_ENV,
      db: config.DB_DRIVER,
      blob: config.BLOB_DRIVER,
      auth: config.AUTH_MODE,
    });
  });

  // API Routes
  app.use('/api/sermons', createSermonRoutes(sermonController));
  app.use('/api/speakers', createSpeakerRoutes(sermonController));
  app.use('/api/mosques', createMosqueRoutes(sermonController));
  app.use('/api/admin', createAdminRoutes(adminController, authProvider));
  app.use('/api/auth', createAuthRoutes(authController, authProvider));

  // ========================================
  // ERROR HANDLING
  // ========================================

  // 404 handler
  app.use(notFoundHandler);

  // Global error handler
  app.use(errorHandler);

  return app;
}

/**
 * Start Server
 */
export function startServer() {
  const config = getConfig();
  const app = createApp();

  app.listen(config.PORT, () => {
    console.log('');
    console.log('═══════════════════════════════════════');
    console.log('🎙️  JummahCast API Server');
    console.log('═══════════════════════════════════════');
    console.log(`🚀 Server running on port ${config.PORT}`);
    console.log(`📊 Environment: ${config.NODE_ENV}`);
    console.log(`💾 Database: ${config.DB_DRIVER}`);
    console.log(`📦 Storage: ${config.BLOB_DRIVER}`);
    console.log(`🔐 Auth: ${config.AUTH_MODE}`);
    console.log('═══════════════════════════════════════');
    console.log('');
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    process.exit(0);
  });

  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully...');
    process.exit(0);
  });
}
