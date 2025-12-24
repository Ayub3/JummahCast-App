import { useRef, useState } from "react";
import { uploadSermon } from "../lib/api.js";

export default function AdminUpload() {
  const fileRef = useRef(null);

  const [title, setTitle] = useState("");
  const [speaker, setSpeaker] = useState("");
  const [date, setDate] = useState("");

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [pickedName, setPickedName] = useState("");

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setMsg("");

    const file = fileRef.current?.files?.[0];
    if (!file) return setErr("Pick an audio file.");

    setBusy(true);
    try {
      await uploadSermon({ title, speaker, date, file });
      setMsg("Uploaded. It will now appear in the Library.");
      setTitle(""); setSpeaker(""); setDate("");
      setPickedName("");
      if (fileRef.current) fileRef.current.value = ""; // clear input
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid">
      <div className="card">
        <div style={{ fontSize: 18, fontWeight: 700 }}>Admin upload</div>
        <div className="muted" style={{ marginTop: 6 }}>Local-only v1. (Auth + S3 comes next.)</div>
        {err ? <div style={{ marginTop: 12, color: "crimson" }}>{err}</div> : null}
        {msg ? <div style={{ marginTop: 12 }}>{msg}</div> : null}
      </div>

      <div className="card">
        <form onSubmit={submit} className="grid">
          <input className="input" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <input className="input" placeholder="Speaker" value={speaker} onChange={(e) => setSpeaker(e.target.value)} />
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />

          <input
            ref={fileRef}
            className="input"
            type="file"
            accept="audio/*"
            onChange={() => setPickedName(fileRef.current?.files?.[0]?.name || "")}
          />

          {pickedName ? <div className="muted" style={{ fontSize: 12 }}>Selected: {pickedName}</div> : null}

          <button className="btn" type="submit" disabled={busy}>
            {busy ? "Uploading…" : "Upload"}
          </button>
        </form>
      </div>
    </div>
  );
}