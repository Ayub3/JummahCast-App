const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

/**
 * Get auth token from localStorage
 */
function getAuthToken() {
  return localStorage.getItem('auth_token');
}

/**
 * Create headers with auth token if available
 */
function getHeaders(includeAuth = false) {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
}

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

  const token = getAuthToken();
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const r = await fetch(`${BASE}/api/admin/upload`, {
    method: "POST",
    headers,
    body: fd
  });

  if (!r.ok) {
    const error = await r.json();
    throw new Error(error.error || "Upload failed");
  }
  return r.json();
}

export async function login(email, password) {
  const r = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: getHeaders(false),
    body: JSON.stringify({ email, password }),
  });

  if (!r.ok) {
    const error = await r.json();
    throw new Error(error.error || "Login failed");
  }
  
  const data = await r.json();
  
  // Store token
  if (data.token) {
    localStorage.setItem('auth_token', data.token);
  }
  
  return data;
}

export function logout() {
  localStorage.removeItem('auth_token');
}