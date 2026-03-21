/**
 * Application Configuration
 * Environment-aware configuration with validation
 */
export function getConfig() {
  const env = process.env;

  // Database Configuration
  const DB_DRIVER = env.DB_DRIVER || 'sqlite';
  const BLOB_DRIVER = env.BLOB_DRIVER || 'local';

  // Authentication Configuration
  const AUTH_MODE = env.AUTH_MODE || 'local'; // 'local' or 'cognito'

  // CORS Configuration
  const CORS_ALLOWED_ORIGINS = (
    env.CORS_ALLOWED_ORIGINS ||
    'http://localhost:5173,http://localhost:4173'
  )
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const config = {
    // Server
    PORT: Number(env.PORT || 4000),
    NODE_ENV: env.NODE_ENV || 'development',

    // Database
    DB_DRIVER,
    BLOB_DRIVER,
    CORS_ALLOWED_ORIGINS,

    // PostgreSQL (production)
    DB_HOST: env.DB_HOST,
    DB_PORT: Number(env.DB_PORT || 5432),
    DB_NAME: env.DB_NAME,
    DB_USER: env.DB_USER,
    DB_PASSWORD: env.DB_PASSWORD,
    DB_SSL: env.DB_SSL === 'true',
    DB_POOL_MAX: Number(env.DB_POOL_MAX || 10),

    // S3 (production)
    AWS_REGION: env.AWS_REGION || 'eu-west-2',
    S3_BUCKET: env.S3_BUCKET,
    SIGNED_URL_TTL_SECONDS: Number(env.SIGNED_URL_TTL_SECONDS || 300),

    // Authentication
    AUTH_MODE,
    
    // Local Auth (development)
    JWT_SECRET: env.JWT_SECRET || 'local-dev-secret-CHANGE-IN-PRODUCTION',

    // AWS Cognito (production)
    COGNITO_USER_POOL_ID: env.COGNITO_USER_POOL_ID,
    COGNITO_CLIENT_ID: env.COGNITO_CLIENT_ID,
    COGNITO_REGION: env.COGNITO_REGION || env.AWS_REGION,
  };

  // Validation
  validateConfig(config);

  return config;
}

/**
 * Validate configuration
 * Ensures required env vars are present
 */
function validateConfig(config) {
  const errors = [];

  // PostgreSQL validation
  if (config.DB_DRIVER === 'postgres') {
    const required = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
    for (const key of required) {
      if (!config[key]) {
        errors.push(`${key} is required when DB_DRIVER=postgres`);
      }
    }
  }

  // S3 validation
  if (config.BLOB_DRIVER === 's3') {
    const required = ['AWS_REGION', 'S3_BUCKET'];
    for (const key of required) {
      if (!config[key]) {
        errors.push(`${key} is required when BLOB_DRIVER=s3`);
      }
    }
  }

  // Cognito validation
  if (config.AUTH_MODE === 'cognito') {
    const required = ['COGNITO_USER_POOL_ID', 'COGNITO_CLIENT_ID'];
    for (const key of required) {
      if (!config[key]) {
        errors.push(`${key} is required when AUTH_MODE=cognito`);
      }
    }
  }

  if (errors.length > 0) {
    console.error('❌ Configuration validation failed:');
    errors.forEach((err) => console.error(`  - ${err}`));
    throw new Error('Invalid configuration');
  }

  // Warnings
  if (config.NODE_ENV === 'production') {
    if (config.AUTH_MODE === 'local') {
      console.warn('⚠️  WARNING: Using local auth in production! Use AUTH_MODE=cognito');
    }
    if (config.JWT_SECRET === 'local-dev-secret-CHANGE-IN-PRODUCTION') {
      console.warn('⚠️  WARNING: Using default JWT secret in production!');
    }
    if (config.DB_DRIVER === 'sqlite') {
      console.warn('⚠️  WARNING: Using SQLite in production! Use DB_DRIVER=postgres');
    }
    if (config.BLOB_DRIVER === 'local') {
      console.warn('⚠️  WARNING: Using local storage in production! Use BLOB_DRIVER=s3');
    }
  }
}
