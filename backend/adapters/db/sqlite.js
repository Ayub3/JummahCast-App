import { openDb } from "../../db.js";

export function createSqliteDb(_config) {
  const db = openDb();

  return {
    async listSermons({ q, speaker, mosque, sort }) {
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
      if (mosque) {
        where.push("mosque = @mosque");
        params.mosque = mosque;
      }

      const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

      let orderSql = "ORDER BY date DESC";
      if (sort === "date_asc")   orderSql = "ORDER BY date ASC";
      if (sort === "title_asc")  orderSql = "ORDER BY title ASC";
      if (sort === "title_desc") orderSql = "ORDER BY title DESC";

      const rows = db
        .prepare(
          `
          SELECT id, title, speaker, date, filename, mimetype, size, durationSeconds,
                 mosque, description, uploadedBy, createdAt
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

    async listMosques() {
      const rows = db
        .prepare(`SELECT DISTINCT mosque FROM sermons WHERE mosque IS NOT NULL AND mosque != '' ORDER BY mosque ASC`)
        .all();
      return rows.map(r => r.mosque);
    },

    async getSermonById(id) {
      const row = db.prepare(`SELECT * FROM sermons WHERE id = ?`).get(id);
      if (!row) return null;

      return {
        ...row,
        storageKey: row.storageKey || row.filepath,
      };
    },

    async insertSermon({
      id, title, speaker, date, filename, storageKey, mimetype, size,
      durationSeconds, mosque, description, uploadedBy, createdAt
    }) {
      // Always insert both filepath AND storageKey so old DBs with
      // "filepath NOT NULL" don't fail a constraint violation.
      const sql = `
        INSERT INTO sermons
          (id, title, speaker, date, filename, filepath, storageKey,
           mimetype, size, durationSeconds, mosque, description, uploadedBy, createdAt)
        VALUES
          (@id, @title, @speaker, @date, @filename, @filepath, @storageKey,
           @mimetype, @size, @durationSeconds, @mosque, @description, @uploadedBy, @createdAt)
      `;
      db.prepare(sql).run({
        id, title, speaker, date, filename,
        filepath: storageKey,   // satisfy legacy NOT NULL constraint
        storageKey,
        mimetype, size,
        durationSeconds: durationSeconds ?? null,
        mosque: mosque ?? null,
        description: description ?? null,
        uploadedBy: uploadedBy ?? null,
        createdAt,
      });
    },

    // ---- User methods ----

    async insertUser({ id, email, password, name, roles, mosque, createdAt, updatedAt }) {
      const sql = `
        INSERT INTO users (id, email, password, name, roles, mosque, createdAt, updatedAt)
        VALUES (@id, @email, @password, @name, @roles, @mosque, @createdAt, @updatedAt)
      `;
      db.prepare(sql).run({ id, email, password, name, roles, mosque, createdAt, updatedAt });
    },

    async getUserByEmail(email) {
      return db.prepare(`SELECT * FROM users WHERE email = ?`).get(email);
    },

    async getUserById(id) {
      return db.prepare(`SELECT * FROM users WHERE id = ?`).get(id);
    },

    async updateUser(id, data) {
      const fields = Object.keys(data).map(key => `${key} = @${key}`).join(', ');
      db.prepare(`UPDATE users SET ${fields} WHERE id = @id`).run({ ...data, id });
    },

    async deleteUser(id) {
      db.prepare(`DELETE FROM users WHERE id = ?`).run(id);
    },

    async listUsers() {
      return db.prepare(`SELECT * FROM users ORDER BY createdAt DESC`).all();
    },

    // ---- Password reset token methods ----

    async insertPasswordResetToken({ email, token, expiresAt, used }) {
      db.prepare(`
        INSERT INTO password_reset_tokens (email, token, expiresAt, used, createdAt)
        VALUES (@email, @token, @expiresAt, @used, @createdAt)
      `).run({
        email, token, expiresAt,
        used: used ? 1 : 0,
        createdAt: new Date().toISOString(),
      });
    },

    async getPasswordResetToken(token) {
      return db.prepare(`SELECT * FROM password_reset_tokens WHERE token = ?`).get(token);
    },

    async updatePasswordResetToken(token, data) {
      const fields = Object.keys(data).map(key => `${key} = @${key}`).join(', ');
      db.prepare(`UPDATE password_reset_tokens SET ${fields} WHERE token = @token`)
        .run({ ...data, token, used: data.used ? 1 : 0 });
    },

    async deleteExpiredPasswordResetTokens() {
      db.prepare(`DELETE FROM password_reset_tokens WHERE expiresAt < ?`).run(new Date().toISOString());
    },
  };
}
