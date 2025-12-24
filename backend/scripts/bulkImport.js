import fs from "fs";
import path from "path";
import { nanoid } from "nanoid";
import { openDb } from "../db.js";

const srcDir = process.argv[2];
if (!srcDir) {
  console.log("Usage: node scripts/bulkImport.js /path/to/audio");
  process.exit(1);
}

const db = openDb();
const UPLOAD_DIR = path.resolve("uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const files = fs.readdirSync(srcDir).filter(f => /\.(mp3|wav|m4a|ogg)$/i.test(f));
console.log(`Found ${files.length} audio files`);

for (const f of files) {
  const from = path.join(srcDir, f);
  const toName = `${Date.now()}-${f.replace(/[^\w.\-]+/g, "_")}`;
  const to = path.join(UPLOAD_DIR, toName);

  fs.copyFileSync(from, to);

  const stat = fs.statSync(to);
  const id = nanoid();

  // naive parsing: "Speaker - Title - YYYY-MM-DD.mp3" (customize later)
  const base = f.replace(/\.[^.]+$/, "");
  const parts = base.split(" - ");
  const speaker = parts[0] || "Unknown";
  const title = parts[1] || base;
  const date = (parts[2] && /^\d{4}-\d{2}-\d{2}$/.test(parts[2])) ? parts[2] : "2000-01-01";

  db.prepare(`
    INSERT INTO sermons (id, title, speaker, date, filename, filepath, mimetype, size, durationSeconds, createdAt)
    VALUES (@id, @title, @speaker, @date, @filename, @filepath, @mimetype, @size, NULL, @createdAt)
  `).run({
    id,
    title,
    speaker,
    date,
    filename: f,
    filepath: to,
    mimetype: guessMime(f),
    size: stat.size,
    createdAt: new Date().toISOString()
  });
}

console.log("Done.");

function guessMime(name) {
  const ext = name.split(".").pop().toLowerCase();
  if (ext === "mp3") return "audio/mpeg";
  if (ext === "wav") return "audio/wav";
  if (ext === "m4a") return "audio/mp4";
  if (ext === "ogg") return "audio/ogg";
  return "application/octet-stream";
}