import { createSqliteDb } from "./sqlite.js";
import { createPostgresDb } from "./postgres.js";

export function createDbAdapter(config) {
  if (config.DB_DRIVER === "postgres") return createPostgresDb(config);
  return createSqliteDb(config);
}

export default { createDbAdapter };