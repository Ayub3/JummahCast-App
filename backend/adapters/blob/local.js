import fs from "fs";
import path from "path";

const UPLOAD_DIR = path.resolve("uploads");

function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

function safeFilename(name) {
  return name.replace(/[^\w.\-]+/g, "_");
}

function streamWithRange(req, res, filePath, mimetype) {
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "File missing" });

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  res.setHeader("Content-Type", mimetype);
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
}

export function createLocalBlob(_config) {
  ensureUploadDir();

  return {
    async putAudio({ id, originalName, buffer }) {
      const savedName = `${Date.now()}-${safeFilename(originalName)}`;
      const filePath = path.join(UPLOAD_DIR, savedName);
      fs.writeFileSync(filePath, buffer);
      return { storageKey: filePath };
    },

    async streamAudio(req, res, sermon) {
      return streamWithRange(req, res, sermon.storageKey, sermon.mimetype);
    },
  };
}
