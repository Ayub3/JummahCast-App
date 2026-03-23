import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { uploadSermon } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function AdminUpload() {
  const fileRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [speaker, setSpeaker] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [pickedName, setPickedName] = useState("");

  // Format mosque slug to display name
  function formatMosque(slug) {
    if (!slug) return "No mosque assigned";
    return slug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  }

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setMsg("");

    if (!title.trim()) return setErr("Title is required.");
    if (!speaker.trim()) return setErr("Speaker is required.");
    if (!date) return setErr("Date is required.");
    const file = fileRef.current?.files?.[0];
    if (!file) return setErr("Please select an audio file.");

    setBusy(true);
    try {
      await uploadSermon({ title, speaker, date, description, file });
      setMsg("Lecture uploaded successfully. It will now appear in the Library.");
      setTitle("");
      setSpeaker("");
      setDate("");
      setDescription("");
      setPickedName("");
      if (fileRef.current) fileRef.current.value = "";
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid">
      <div className="card" style={{ textAlign: "left" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>Upload Lecture</div>
            <div className="muted" style={{ marginTop: 6 }}>
              Add a new lecture to the library
            </div>
          </div>
          <Link className="muted" to="/library" style={{ textDecoration: "none", whiteSpace: "nowrap" }}>
            ← Back to Library
          </Link>
        </div>

        {/* Mosque badge */}
        <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
          <span className="muted" style={{ fontSize: 13 }}>Uploading as:</span>
          <span style={{
            padding: "3px 10px",
            background: user?.mosque ? "#f0f9ff" : "#f3f4f6",
            color: user?.mosque ? "#0369a1" : "#9ca3af",
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 600,
          }}>
            {formatMosque(user?.mosque)}
          </span>
          {user?.name && (
            <span className="muted" style={{ fontSize: 13 }}>· {user.name}</span>
          )}
        </div>

        {err ? (
          <div style={{ marginTop: 12, padding: 12, background: '#fee2e2', borderRadius: 8, color: '#dc2626', fontSize: 14 }}>
            {err}
          </div>
        ) : null}
        {msg ? (
          <div style={{ marginTop: 12, padding: 12, background: '#d1fae5', borderRadius: 8, color: '#065f46', fontSize: 14 }}>
            ✓ {msg}
          </div>
        ) : null}
      </div>

      <div className="card" style={{ textAlign: "left" }}>
        <form onSubmit={submit} className="grid">
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 600 }}>
              Title <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              className="input"
              placeholder="e.g. The Importance of Patience"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 600 }}>
              Speaker <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              className="input"
              placeholder="e.g. Sheikh Omar Suleiman"
              value={speaker}
              onChange={(e) => setSpeaker(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 600 }}>
              Date <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              className="input"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 600 }}>
              Description <span className="muted" style={{ fontWeight: 400 }}>(optional)</span>
            </label>
            <textarea
              className="input"
              placeholder="Brief description of this lecture…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              style={{ resize: "vertical", fontFamily: "inherit" }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 600 }}>
              Audio File <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              ref={fileRef}
              className="input"
              type="file"
              accept="audio/*"
              onChange={() => setPickedName(fileRef.current?.files?.[0]?.name || "")}
              required
            />
            {pickedName ? (
              <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                Selected: {pickedName}
              </div>
            ) : (
              <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                MP3, M4A, WAV, OGG accepted. Max 200 MB.
              </div>
            )}
          </div>

          <button className="btn" type="submit" disabled={busy} style={{ marginTop: 4 }}>
            {busy ? "Uploading…" : "Upload Lecture"}
          </button>
        </form>
      </div>
    </div>
  );
}

