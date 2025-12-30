import fs from "fs";
import path from "path";
import Database from "better-sqlite3";

export function openDb() {
  const dir = path.resolve("data");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const db = new Database(path.join(dir, "app.db"));
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS sermons (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      speaker TEXT NOT NULL,
      date TEXT NOT NULL,
      filename TEXT NOT NULL,
      filepath TEXT NOT NULL,
      mimetype TEXT NOT NULL,
      size INTEGER NOT NULL,
      durationSeconds INTEGER,
      createdAt TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_speaker ON sermons(speaker);
    CREATE INDEX IF NOT EXISTS idx_date ON sermons(date);
    CREATE INDEX IF NOT EXISTS idx_title ON sermons(title);
  `);

  return db;
}