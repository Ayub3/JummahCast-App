import pg from "pg";
const { Pool } = pg;

function assertPg(config) {
  const missing = [];
  for (const k of ["DB_HOST", "DB_NAME", "DB_USER", "DB_PASSWORD"]) {
    if (!config[k]) missing.push(k);
  }
  if (missing.length) throw new Error(`Missing Postgres env vars: ${missing.join(", ")}`);
}

export function createPostgresDb(config) {
  assertPg(config);

  const pool = new Pool({
    host: config.DB_HOST,
    port: config.DB_PORT,
    database: config.DB_NAME,
    user: config.DB_USER,
    password: config.DB_PASSWORD,
    ssl: config.DB_SSL ? { rejectUnauthorized: false } : false,
    max: config.DB_POOL_MAX,
  });

  return {
    // ---- Sermon methods ----

    async listSermons({ q, speaker, mosque, sort } = {}) {
      const where = [];
      const params = [];
      let i = 1;

      if (q) {
        where.push(`(title ILIKE $${i} OR speaker ILIKE $${i})`);
        params.push(`%${q}%`);
        i++;
      }
      if (speaker) {
        where.push(`speaker = $${i}`);
        params.push(speaker);
        i++;
      }
      if (mosque) {
        where.push(`mosque = $${i}`);
        params.push(mosque);
        i++;
      }

      const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

      let orderSql = "ORDER BY date DESC";
      if (sort === "date_asc")   orderSql = "ORDER BY date ASC";
      if (sort === "title_asc")  orderSql = "ORDER BY title ASC";
      if (sort === "title_desc") orderSql = "ORDER BY title DESC";

      const sql = `
        SELECT
          id,
          title,
          speaker,
          to_char(date, 'YYYY-MM-DD') AS date,
          filename,
          storage_key       AS "storageKey",
          mimetype,
          size,
          duration_seconds  AS "durationSeconds",
          mosque,
          description,
          uploaded_by       AS "uploadedBy",
          to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "createdAt"
        FROM sermons
        ${whereSql}
        ${orderSql}
        LIMIT 200
      `;

      const out = await pool.query(sql, params);
      return out.rows.map(r => ({ ...r, size: Number(r.size) }));
    },

    async listSpeakers() {
      const out = await pool.query(
        `SELECT DISTINCT speaker FROM sermons ORDER BY speaker ASC`
      );
      return out.rows.map(r => r.speaker);
    },

    async listMosques() {
      const out = await pool.query(
        `SELECT DISTINCT mosque FROM sermons WHERE mosque IS NOT NULL AND mosque != '' ORDER BY mosque ASC`
      );
      return out.rows.map(r => r.mosque);
    },

    async getSermonById(id) {
      const out = await pool.query(
        `SELECT
           id, title, speaker,
           to_char(date, 'YYYY-MM-DD') AS date,
           filename,
           storage_key      AS "storageKey",
           mimetype, size,
           duration_seconds AS "durationSeconds",
           mosque,
           description,
           uploaded_by      AS "uploadedBy",
           to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "createdAt"
         FROM sermons WHERE id = $1`,
        [id]
      );
      return out.rows[0] || null;
    },

    async insertSermon({
      id, title, speaker, date, filename, storageKey, mimetype, size,
      durationSeconds, mosque, description, uploadedBy, createdAt,
    }) {
      await pool.query(
        `INSERT INTO sermons
           (id, title, speaker, date, filename, storage_key, mimetype, size,
            duration_seconds, mosque, description, uploaded_by, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [
          id, title, speaker, date, filename, storageKey, mimetype, size,
          durationSeconds ?? null,
          mosque ?? null,
          description ?? null,
          uploadedBy ?? null,
          createdAt,
        ]
      );
    },

    // ---- User methods ----

    async insertUser({ id, email, password, name, roles, mosque, createdAt, updatedAt }) {
      await pool.query(
        `INSERT INTO users (id, email, password, name, roles, mosque, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [id, email, password, name, roles, mosque ?? null, createdAt, updatedAt]
      );
    },

    async getUserByEmail(email) {
      const out = await pool.query(
        `SELECT id, email, password, name, roles, mosque,
                to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "createdAt",
                to_char(updated_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "updatedAt"
         FROM users WHERE email = $1`,
        [email]
      );
      return out.rows[0] || null;
    },

    async getUserById(id) {
      const out = await pool.query(
        `SELECT id, email, password, name, roles, mosque,
                to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "createdAt",
                to_char(updated_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "updatedAt"
         FROM users WHERE id = $1`,
        [id]
      );
      return out.rows[0] || null;
    },

    async updateUser(id, data) {
      const colMap = { updatedAt: "updated_at", password: "password", roles: "roles", mosque: "mosque" };
      const keys = Object.keys(data);
      const sets = keys.map((k, idx) => `${colMap[k] || k} = $${idx + 1}`).join(", ");
      await pool.query(
        `UPDATE users SET ${sets} WHERE id = $${keys.length + 1}`,
        [...Object.values(data), id]
      );
    },

    async deleteUser(id) {
      await pool.query(`DELETE FROM users WHERE id = $1`, [id]);
    },

    async listUsers() {
      const out = await pool.query(`SELECT * FROM users ORDER BY created_at DESC`);
      return out.rows;
    },

    // ---- Password reset token methods ----

    async insertPasswordResetToken({ email, token, expiresAt, used }) {
      await pool.query(
        `INSERT INTO password_reset_tokens (email, token, expires_at, used, created_at)
         VALUES ($1,$2,$3,$4,$5)`,
        [email, token, expiresAt, used ? true : false, new Date().toISOString()]
      );
    },

    async getPasswordResetToken(token) {
      const out = await pool.query(
        `SELECT * FROM password_reset_tokens WHERE token = $1`,
        [token]
      );
      return out.rows[0] || null;
    },

    async updatePasswordResetToken(token, data) {
      const keys = Object.keys(data);
      const sets = keys.map((k, idx) => `${k} = $${idx + 1}`).join(", ");
      await pool.query(
        `UPDATE password_reset_tokens SET ${sets} WHERE token = $${keys.length + 1}`,
        [...Object.values(data), token]
      );
    },

    async deleteExpiredPasswordResetTokens() {
      await pool.query(
        `DELETE FROM password_reset_tokens WHERE expires_at < $1`,
        [new Date().toISOString()]
      );
    },
  };
}
