import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import bcrypt from "bcrypt";

export function openDb() {
  const dir = path.resolve("data");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const db = new Database(path.join(dir, "app.db"));
  db.pragma("journal_mode = WAL");

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS sermons (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      speaker TEXT NOT NULL,
      date TEXT NOT NULL,
      filename TEXT NOT NULL,
      filepath TEXT,
      storageKey TEXT,
      mimetype TEXT NOT NULL,
      size INTEGER NOT NULL,
      durationSeconds INTEGER,
      mosque TEXT,
      description TEXT,
      uploadedBy TEXT,
      createdAt TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_speaker ON sermons(speaker);
    CREATE INDEX IF NOT EXISTS idx_date ON sermons(date);
    CREATE INDEX IF NOT EXISTS idx_title ON sermons(title);

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      roles TEXT NOT NULL DEFAULT '["user"]',
      mosque TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_user_email ON users(email);

    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      expiresAt TEXT NOT NULL,
      used INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_reset_token ON password_reset_tokens(token);
    CREATE INDEX IF NOT EXISTS idx_reset_email ON password_reset_tokens(email);
  `);

  // ---- Backward compatibility: add columns if missing ----
  const sermonCols = db.prepare(`PRAGMA table_info(sermons)`).all().map(c => c.name);
  if (!sermonCols.includes("storageKey"))   db.exec(`ALTER TABLE sermons ADD COLUMN storageKey TEXT`);
  if (!sermonCols.includes("mosque"))       db.exec(`ALTER TABLE sermons ADD COLUMN mosque TEXT`);
  if (!sermonCols.includes("description")) db.exec(`ALTER TABLE sermons ADD COLUMN description TEXT`);
  if (!sermonCols.includes("uploadedBy"))  db.exec(`ALTER TABLE sermons ADD COLUMN uploadedBy TEXT`);

  // Create mosque index now (safe – column guaranteed to exist after migration)
  db.exec(`CREATE INDEX IF NOT EXISTS idx_mosque ON sermons(mosque)`);

  // ---- Seed development users on first run ----
  if (process.env.NODE_ENV !== "production") {
    seedDevUsers(db);
  }

  return db;
}

/**
 * Seed development users synchronously so test credentials work out of the box.
 * Uses bcrypt.hashSync to keep everything synchronous.
 * Safe to call on every startup – skips existing emails.
 */
function seedDevUsers(db) {
  const DEV_USERS = [
    {
      id: "seed-admin-1",
      email: "admin@jummahcast.local",
      password: "admin123",
      name: "Green Lane Admin",
      roles: ["admin"],
      mosque: "green-lane-masjid",
    },
    {
      id: "seed-admin-2",
      email: "admin2@jummahcast.local",
      password: "admin123",
      name: "East London Admin",
      roles: ["admin"],
      mosque: "east-london-mosque",
    },
    {
      id: "seed-user-1",
      email: "user@jummahcast.local",
      password: "user123",
      name: "Regular User",
      roles: ["user"],
      mosque: null,
    },
    {
      id: "seed-user-2",
      email: "user2@jummahcast.local",
      password: "user123",
      name: "Second User",
      roles: ["user"],
      mosque: null,
    },
  ];

  const check = db.prepare(`SELECT id FROM users WHERE email = ?`);
  const insert = db.prepare(`
    INSERT INTO users (id, email, password, name, roles, mosque, createdAt, updatedAt)
    VALUES (@id, @email, @password, @name, @roles, @mosque, @createdAt, @updatedAt)
  `);

  for (const u of DEV_USERS) {
    if (check.get(u.email)) continue; // already seeded

    try {
      const hashed = bcrypt.hashSync(u.password, 10);
      const now = new Date().toISOString();
      insert.run({
        id: u.id,
        email: u.email,
        password: hashed,
        name: u.name,
        roles: JSON.stringify(u.roles),
        mosque: u.mosque,
        createdAt: now,
        updatedAt: now,
      });
      console.log(`🌱 Seeded: ${u.email} [${u.roles.join(",")}]${u.mosque ? ` · mosque: ${u.mosque}` : ""}`);
    } catch (err) {
      console.error(`Failed to seed ${u.email}:`, err.message);
    }
  }
}
