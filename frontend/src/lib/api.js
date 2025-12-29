const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

export async function getSpeakers() {
  const r = await fetch(`${BASE}/api/speakers`);
  if (!r.ok) throw new Error("Failed to load speakers");
  return r.json();
}

export async function getSermons({ q = "", speaker = "", sort = "date_desc" }) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (speaker) params.set("speaker", speaker);
  if (sort) params.set("sort", sort);

  const r = await fetch(`${BASE}/api/sermons?${params.toString()}`);
  if (!r.ok) throw new Error("Failed to load sermons");
  return r.json();
}

export function streamUrl(id) {
  return `${BASE}/api/sermons/${id}/stream`;
}

export async function uploadSermon({ title, speaker, date, file }) {
  const fd = new FormData();
  fd.append("title", title);
  fd.append("speaker", speaker);
  fd.append("date", date);
  fd.append("file", file);

  const r = await fetch(`${BASE}/api/admin/upload`, {
    method: "POST",
    body: fd
  });

  if (!r.ok) throw new Error("Upload failed");
  return r.json();
}