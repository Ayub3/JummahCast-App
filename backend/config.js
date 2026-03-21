export function getConfig() {
  const env = process.env;

  const DB_DRIVER = env.DB_DRIVER || "sqlite";     // sqlite | postgres
  const BLOB_DRIVER = env.BLOB_DRIVER || "local";  // local | s3

  const CORS_ALLOWED_ORIGINS = (env.CORS_ALLOWED_ORIGINS ||
    "http://localhost:5173,http://localhost:4173")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

  return {
    PORT: Number(env.PORT || 4000),
    DB_DRIVER,
    BLOB_DRIVER,
    CORS_ALLOWED_ORIGINS,

    // Postgres (AWS)
    DB_HOST: env.DB_HOST,
    DB_PORT: Number(env.DB_PORT || 5432),
    DB_NAME: env.DB_NAME,
    DB_USER: env.DB_USER,
    DB_PASSWORD: env.DB_PASSWORD,
    DB_SSL: env.DB_SSL === "true",
    DB_POOL_MAX: Number(env.DB_POOL_MAX || 10),

    // S3 (AWS)
    AWS_REGION: env.AWS_REGION,
    S3_BUCKET: env.S3_BUCKET,
    SIGNED_URL_TTL_SECONDS: Number(env.SIGNED_URL_TTL_SECONDS || 300),
  };
}
