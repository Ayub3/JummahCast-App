import Database from "better-sqlite3";

export function openDb() {
  const db = new Database("data/app.db");
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