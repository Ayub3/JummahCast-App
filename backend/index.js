import express from "express";
import cors from "cors";
import multer from "multer";
import { nanoid } from "nanoid";
import { z } from "zod";
import { getConfig } from "./config.js";
// import { createDbAdapter } from "./adapters/db/index.js";
// import { createBlobAdapter } from "./adapters/blob/index.js";
import dbPkg from "./adapters/db/index.js";
import blobPkg from "./adapters/blob/index.js";

const { createDbAdapter } = dbPkg;
const { createBlobAdapter } = blobPkg;


const app = express();
const config = getConfig();

const db = createDbAdapter(config);
const blob = createBlobAdapter(config);

app.use(cors({ origin: config.CORS_ALLOWED_ORIGINS }));
app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("audio/")) return cb(new Error("Only audio files allowed"));
    cb(null, true);
  }
});

app.get("/health", (_req, res) =>
  res.json({ ok: true, db: config.DB_DRIVER, blob: config.BLOB_DRIVER })
);

app.get("/api/sermons", async (req, res) => {
  const q = (req.query.q || "").toString().trim();
  const speaker = (req.query.speaker || "").toString().trim();
  const sort = (req.query.sort || "date_desc").toString();

  const items = await db.listSermons({ q, speaker, sort });
  res.json({ items });
});

app.get("/api/speakers", async (_req, res) => {
  const speakers = await db.listSpeakers();
  res.json({ speakers });
});

app.get("/api/sermons/:id/stream", async (req, res) => {
  const sermon = await db.getSermonById(req.params.id);
  if (!sermon) return res.status(404).json({ error: "Not found" });

  // Local: streams bytes from disk
  // AWS: 302 redirects to presigned S3 URL
  return blob.streamAudio(req, res, sermon);
});

app.post("/api/admin/upload", upload.single("file"), async (req, res) => {
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

  // 1) store audio (disk or S3)
  const { storageKey } = await blob.putAudio({
    id,
    date: parsed.data.date,
    originalName: req.file.originalname,
    mimetype: req.file.mimetype,
    buffer: req.file.buffer,
  });

  // 2) store metadata (SQLite or Postgres)
  await db.insertSermon({
    id,
    title: parsed.data.title,
    speaker: parsed.data.speaker,
    date: parsed.data.date,
    filename: req.file.originalname,
    storageKey,
    mimetype: req.file.mimetype,
    size: req.file.size,
    durationSeconds: null,
    createdAt: now,
  });

  res.json({ ok: true, id });
});

app.listen(config.PORT, () => {
  console.log(`Backend running on port ${config.PORT}`);
  console.log(`DB driver: ${config.DB_DRIVER} | Blob driver: ${config.BLOB_DRIVER}`);
});
