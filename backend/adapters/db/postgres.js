import pg from "pg";
const { Pool } = pg;

function assertPg(config) {
  const missing = [];
  for (const k of ["DB_HOST","DB_NAME","DB_USER","DB_PASSWORD"]) {
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
    async listSermons({ q, speaker, sort }) {
      const where = [];
      const params = [];
      let i = 1;

      if (q) { where.push(`(title ILIKE $${i} OR speaker ILIKE $${i})`); params.push(`%${q}%`); i++; }
      if (speaker) { where.push(`speaker = $${i}`); params.push(speaker); i++; }

      const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

      let orderSql = `ORDER BY date DESC`;
      if (sort === "date_asc") orderSql = "ORDER BY date ASC";
      if (sort === "title_asc") orderSql = "ORDER BY title ASC";
      if (sort === "title_desc") orderSql = "ORDER BY title DESC";

      const sql = `
        SELECT
          id,
          title,
          speaker,
          to_char(date, 'YYYY-MM-DD') AS date,
          filename,
          storage_key AS "storageKey",
          mimetype,
          size,
          duration_seconds AS "durationSeconds",
          to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "createdAt"
        FROM sermons
        ${whereSql}
        ${orderSql}
        LIMIT 200
      `;

      const out = await pool.query(sql, params);
      // Keep response shape identical to your frontend expectations:
      return out.rows.map(r => ({
        id: r.id,
        title: r.title,
        speaker: r.speaker,
        date: r.date,
        filename: r.filename,
        mimetype: r.mimetype,
        size: Number(r.size),
        durationSeconds: r.durationSeconds ?? null,
        createdAt: r.createdAt,
      }));
    },

    async listSpeakers() {
      const out = await pool.query(`SELECT DISTINCT speaker FROM sermons ORDER BY speaker ASC`);
      return out.rows.map(r => r.speaker);
    },

    async getSermonById(id) {
      const out = await pool.query(
        `SELECT id, title, speaker, to_char(date, 'YYYY-MM-DD') AS date, filename,
                storage_key AS "storageKey", mimetype, size,
                duration_seconds AS "durationSeconds",
                to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "createdAt"
         FROM sermons WHERE id = $1`,
        [id]
      );
      return out.rows[0] || null;
    },

    async insertSermon({
      id, title, speaker, date, filename, storageKey, mimetype, size, durationSeconds, createdAt
    }) {
      await pool.query(
        `INSERT INTO sermons
          (id, title, speaker, date, filename, storage_key, mimetype, size, duration_seconds, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [id, title, speaker, date, filename, storageKey, mimetype, size, durationSeconds ?? null, createdAt]
      );
    },
  };
}
