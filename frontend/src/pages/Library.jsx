import { useEffect, useMemo, useRef, useState } from "react";
import { getSpeakers, getSermons, streamUrl } from "../lib/api.js";

export default function Library() {
  const [q, setQ] = useState("");
  const [speaker, setSpeaker] = useState("");
  const [sort, setSort] = useState("date_desc");

  const [speakers, setSpeakers] = useState([]);
  const [items, setItems] = useState([]);

  const [now, setNow] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const audioRef = useRef(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [sp, se] = await Promise.all([
        getSpeakers(),
        getSermons({ q, speaker, sort })
      ]);
      setSpeakers(sp.speakers);
      setItems(se.items);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // Debounce search/filter changes
  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, speaker, sort]);

  // Force audio to reload + attempt autoplay when changing track
  useEffect(() => {
    if (!now) return;
    const el = audioRef.current;
    if (!el) return;

    // Ensure new src is loaded
    el.load();

    // Attempt to autoplay (should succeed because it's user-initiated click)
    const p = el.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  }, [now?.id]);

  const subtitle = useMemo(() => {
    const parts = [];
    if (speaker) parts.push(speaker);
    if (q) parts.push(`“${q}”`);
    return parts.length ? parts.join(" · ") : "Search and explore weekly khutbahs.";
  }, [speaker, q]);

  return (
    <div className="grid">
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>Library</div>
            <div className="muted" style={{ marginTop: 6 }}>{subtitle}</div>
          </div>
          <button className="btn secondary" onClick={load} disabled={loading}>
            {loading ? "…" : "Refresh"}
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 220px 220px", gap: 10, marginTop: 14 }}>
          <input
            className="input"
            placeholder="Search by title or speaker…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <select className="select" value={speaker} onChange={(e) => setSpeaker(e.target.value)}>
            <option value="">All speakers</option>
            {speakers.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select className="select" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="date_desc">Newest</option>
            <option value="date_asc">Oldest</option>
            <option value="title_asc">Title A→Z</option>
            <option value="title_desc">Title Z→A</option>
          </select>
        </div>

        {error ? <div style={{ marginTop: 12, color: "crimson" }}>{error}</div> : null}

        {now ? (
          <div style={{ marginTop: 14 }}>
            <div className="muted" style={{ marginBottom: 8 }}>
              Now playing: <span style={{ color: "#0b0b0c" }}>{now.title}</span>{" "}
              <span className="muted">· {now.speaker} · {now.date}</span>
            </div>

            <audio
              key={now.id}              // forces remount when track changes
              ref={audioRef}
              className="player"
              controls
              preload="metadata"
              src={streamUrl(now.id)}
            />
          </div>
        ) : (
          <div className="muted" style={{ marginTop: 14 }}>Pick a khutbah to play.</div>
        )}
      </div>

      <div className="card">
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>
          Results <span className="muted">({items.length})</span>
        </div>

        <div className="grid">
          {items.map((it) => (
            <div className="row" key={it.id}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 650, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {it.title}
                </div>
                <div className="muted" style={{ fontSize: 12 }}>
                  {it.speaker} · {it.date} · {(it.size / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>

              <button className="btn" onClick={() => setNow(it)}>
                Play
              </button>
            </div>
          ))}
          {!loading && items.length === 0 ? <div className="muted">No results.</div> : null}
        </div>
      </div>
    </div>
  );
}