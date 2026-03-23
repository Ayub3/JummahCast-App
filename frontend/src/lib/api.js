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

export async function getMosques() {
  const r = await fetch(`${BASE}/api/mosques`);
  if (!r.ok) throw new Error("Failed to load mosques");
  return r.json();
}

export async function getSermons({ q = "", speaker = "", mosque = "", sort = "date_desc" }) {
  const params = new URLSearchParams();
  if (q)      params.set("q", q);
  if (speaker) params.set("speaker", speaker);
  if (mosque)  params.set("mosque", mosque);
  if (sort)    params.set("sort", sort);

  const r = await fetch(`${BASE}/api/sermons?${params.toString()}`);
  if (!r.ok) throw new Error("Failed to load sermons");
  return r.json();
}

export function streamUrl(id) {
  return `${BASE}/api/sermons/${id}/stream`;
}

export async function uploadSermon({ title, speaker, date, description, file }) {
  const fd = new FormData();
  fd.append("title", title);
  fd.append("speaker", speaker);
  fd.append("date", date);
  if (description) fd.append("description", description);
  fd.append("file", file);

  const token = getAuthToken();
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const r = await fetch(`${BASE}/api/admin/upload`, {
    method: "POST",
    headers,
    body: fd,
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

export async function signup(email, password, name, mosque) {
  const r = await fetch(`${BASE}/api/auth/signup`, {
    method: "POST",
    headers: getHeaders(false),
    body: JSON.stringify({ email, password, name, ...(mosque ? { mosque } : {}) }),
  });

  if (!r.ok) {
    const error = await r.json();
    throw new Error(error.error || "Signup failed");
  }

  const data = await r.json();
  if (data.token) localStorage.setItem('auth_token', data.token);
  return data;
}

export async function forgotPassword(email) {
  const r = await fetch(`${BASE}/api/auth/forgot-password`, {
    method: "POST",
    headers: getHeaders(false),
    body: JSON.stringify({ email }),
  });

  if (!r.ok) {
    const error = await r.json();
    throw new Error(error.error || "Failed to request password reset");
  }
  
  return r.json();
}

export async function resetPassword(token, password) {
  const r = await fetch(`${BASE}/api/auth/reset-password`, {
    method: "POST",
    headers: getHeaders(false),
    body: JSON.stringify({ token, password }),
  });

  if (!r.ok) {
    const error = await r.json();
    throw new Error(error.error || "Failed to reset password");
  }
  
  return r.json();
}

export async function socialLogin(provider) {
  // Placeholder for social login via Cognito
  // In production, this would redirect to AWS Cognito Hosted UI
  throw new Error(`${provider} login requires AWS Cognito OAuth setup`);
}

export function logout() {
  localStorage.removeItem('auth_token');
}