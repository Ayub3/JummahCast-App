import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";
import { nanoid } from "nanoid";
import { z } from "zod";
import { openDb } from "./db.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

const db = openDb();

const UPLOAD_DIR = path.resolve("uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    // keep it safe and unique
    const safe = file.originalname.replace(/[^\w.\-]+/g, "_");
    cb(null, `${Date.now()}-${safe}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("audio/")) return cb(new Error("Only audio files allowed"));
    cb(null, true);
  }
});

app.get("/health", (_req, res) => res.json({ ok: true }));

/**
 * GET /api/sermons
 * Query:
 *  - q: search string
 *  - speaker: exact speaker filter
 *  - sort: "date_desc" | "date_asc" | "title_asc" | "title_desc"
 */
app.get("/api/sermons", (req, res) => {
  const q = (req.query.q || "").toString().trim();
  const speaker = (req.query.speaker || "").toString().trim();
  const sort = (req.query.sort || "date_desc").toString();

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

  res.json({ items: rows });
});

app.get("/api/speakers", (_req, res) => {
  const rows = db.prepare(`SELECT DISTINCT speaker FROM sermons ORDER BY speaker ASC`).all();
  res.json({ speakers: rows.map(r => r.speaker) });
});

/**
 * Stream with Range support so <audio> can seek.
 */
app.get("/api/sermons/:id/stream", (req, res) => {
  const id = req.params.id;
  const row = db.prepare(`SELECT * FROM sermons WHERE id = ?`).get(id);
  if (!row) return res.status(404).json({ error: "Not found" });

  const filePath = row.filepath;
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "File missing" });

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  res.setHeader("Content-Type", row.mimetype);
  res.setHeader("Accept-Ranges", "bytes");

  if (range) {
    const match = /bytes=(\d+)-(\d*)/.exec(range);
    if (!match) return res.status(416).end();

    const start = parseInt(match[1], 10);
    const end = match[2] ? parseInt(match[2], 10) : fileSize - 1;

    if (start >= fileSize || end >= fileSize) {
      res.setHeader("Content-Range", `bytes */${fileSize}`);
      return res.status(416).end();
    }

    res.status(206);
    res.setHeader("Content-Range", `bytes ${start}-${end}/${fileSize}`);
    res.setHeader("Content-Length", end - start + 1);

    fs.createReadStream(filePath, { start, end }).pipe(res);
  } else {
    res.setHeader("Content-Length", fileSize);
    fs.createReadStream(filePath).pipe(res);
  }
});

/**
 * Admin upload (no auth for v1)
 * POST /api/admin/upload (multipart/form-data)
 * fields: title, speaker, date (YYYY-MM-DD), file
 */
app.post("/api/admin/upload", upload.single("file"), (req, res) => {
  const schema = z.object({
    title: z.string().min(1),
    speaker: z.string().min(1),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid fields" });

  if (!req.file) return res.status(400).json({ error: "Missing file" });

  const id = nanoid();
  const now = new Date().toISOString();

  db.prepare(
    `
    INSERT INTO sermons (id, title, speaker, date, filename, filepath, mimetype, size, durationSeconds, createdAt)
    VALUES (@id, @title, @speaker, @date, @filename, @filepath, @mimetype, @size, NULL, @createdAt)
    `
  ).run({
    id,
    title: parsed.data.title,
    speaker: parsed.data.speaker,
    date: parsed.data.date,
    filename: req.file.originalname,
    filepath: req.file.path,
    mimetype: req.file.mimetype,
    size: req.file.size,
    createdAt: now
  });

  res.json({ ok: true, id });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
  console.log(`Uploads dir: ${UPLOAD_DIR}`);
});