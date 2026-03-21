import { openDb } from "../../db.js";

export function createSqliteDb(_config) {
  const db = openDb();

  // Backwards-compatible: if existing table uses filepath, keep it.
  // If you want, you can update your CREATE TABLE in db.js to use storageKey going forward.
  // For now, we’ll just write to `storageKey` if it exists, otherwise `filepath`.

  function hasColumn(table, col) {
    const cols = db.prepare(`PRAGMA table_info(${table})`).all();
    return cols.some(c => c.name === col);
  }

  const hasStorageKey = hasColumn("sermons", "storageKey");
  const storageCol = hasStorageKey ? "storageKey" : "filepath";

  return {
    async listSermons({ q, speaker, sort }) {
      const where = [];
      const params = {};

      if (q) {
        where.push("(title LIKE @like OR speaker LIKE @like)");
        params.like = `%${q}%`;
      }
      if (speaker) {
        where.push("speaker = @speaker");
        params.speaker = speaker;
      }

      const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

      let orderSql = "ORDER BY date DESC";
      if (sort === "date_asc") orderSql = "ORDER BY date ASC";
      if (sort === "title_asc") orderSql = "ORDER BY title ASC";
      if (sort === "title_desc") orderSql = "ORDER BY title DESC";

      const rows = db
        .prepare(
          `
          SELECT id, title, speaker, date, filename, mimetype, size, durationSeconds, createdAt
          FROM sermons
          ${whereSql}
          ${orderSql}
          LIMIT 200
          `
        )
        .all(params);

      return rows;
    },

    async listSpeakers() {
      const rows = db.prepare(`SELECT DISTINCT speaker FROM sermons ORDER BY speaker ASC`).all();
      return rows.map(r => r.speaker);
    },

    async getSermonById(id) {
      const row = db.prepare(`SELECT * FROM sermons WHERE id = ?`).get(id);
      if (!row) return null;

      // normalize for blob adapter
      return {
        ...row,
        storageKey: row.storageKey || row.filepath, // compatibility
      };
    },

    async insertSermon({
      id, title, speaker, date, filename, storageKey, mimetype, size, durationSeconds, createdAt
    }) {
      const cols = ["id","title","speaker","date","filename",storageCol,"mimetype","size","durationSeconds","createdAt"];
      const sql = `
        INSERT INTO sermons (${cols.join(", ")})
        VALUES (@id, @title, @speaker, @date, @filename, @storageKey, @mimetype, @size, @durationSeconds, @createdAt)
      `;

      db.prepare(sql).run({
        id, title, speaker, date, filename,
        storageKey, mimetype, size,
        durationSeconds: durationSeconds ?? null,
        createdAt,
      });
    },
  };
}
