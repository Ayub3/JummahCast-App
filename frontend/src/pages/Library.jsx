import { useEffect, useMemo, useRef, useState } from "react";
import { getSpeakers, getMosques, getSermons, streamUrl } from "../lib/api.js";

export default function Library() {
  const [q, setQ] = useState("");
  const [speaker, setSpeaker] = useState("");
  const [mosque, setMosque] = useState("");
  const [sort, setSort] = useState("date_desc");

  const [speakers, setSpeakers] = useState([]);
  const [mosques, setMosques] = useState([]);
  const [items, setItems] = useState([]);

  const [now, setNow] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const audioRef = useRef(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [sp, mo, se] = await Promise.all([
        getSpeakers(),
        getMosques(),
        getSermons({ q, speaker, mosque, sort }),
      ]);
      setSpeakers(sp.speakers || []);
      setMosques(mo.mosques || []);
      setItems(se.items || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, speaker, mosque, sort]);

  useEffect(() => {
    if (!now) return;
    const el = audioRef.current;
    if (!el) return;
    el.load();
    const p = el.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  }, [now?.id]);

  const subtitle = useMemo(() => {
    const parts = [];
    if (speaker) parts.push(speaker);
    if (mosque) parts.push(mosque.replace(/-/g, " "));
    if (q) parts.push(`"${q}"`);
    return parts.length ? parts.join(" · ") : "Search and explore weekly khutbahs.";
  }, [speaker, mosque, q]);

  // Format mosque slug to display name
  function formatMosque(slug) {
    if (!slug) return null;
    return slug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  }

  return (
    <div className="grid">
      <div className="card" style={{ textAlign: "left" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>Library</div>
            <div className="muted" style={{ marginTop: 6 }}>{subtitle}</div>
          </div>
          <button className="btn secondary" onClick={load} disabled={loading}>
            {loading ? "…" : "Refresh"}
          </button>
        </div>

        {/* Filter controls */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 10,
            marginTop: 14,
          }}
        >
          <input
            className="input"
            placeholder="Search title or speaker…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <select className="select" value={speaker} onChange={(e) => setSpeaker(e.target.value)}>
            <option value="">All speakers</option>
            {speakers.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select className="select" value={mosque} onChange={(e) => setMosque(e.target.value)}>
            <option value="">All mosques</option>
            {mosques.map((m) => (
              <option key={m} value={m}>{formatMosque(m)}</option>
            ))}
          </select>

          <select className="select" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="date_desc">Newest first</option>
            <option value="date_asc">Oldest first</option>
            <option value="title_asc">Title A→Z</option>
            <option value="title_desc">Title Z→A</option>
          </select>
        </div>

        {error ? (
          <div style={{ marginTop: 12, padding: 10, background: '#fee2e2', color: '#dc2626', borderRadius: 8, fontSize: 14 }}>
            {error}
          </div>
        ) : null}

        {/* Now playing */}
        {now ? (
          <div style={{ marginTop: 14 }}>
            <div className="muted" style={{ marginBottom: 8 }}>
              Now playing:{" "}
              <span style={{ color: "#0b0b0c", fontWeight: 600 }}>{now.title}</span>
              {" "}·{" "}
              <span>{now.speaker}</span>
              {" "}·{" "}
              <span>{now.date}</span>
              {now.mosque && (
                <span style={{
                  marginLeft: 8, padding: "2px 8px",
                  background: "#f0f9ff", color: "#0369a1",
                  borderRadius: 4, fontSize: 12, fontWeight: 600
                }}>
                  {formatMosque(now.mosque)}
                </span>
              )}
            </div>
            <audio
              key={now.id}
              ref={audioRef}
              className="player"
              controls
              preload="metadata"
              src={streamUrl(now.id)}
            />
            {now.description && (
              <div className="muted" style={{ marginTop: 8, fontSize: 13, lineHeight: 1.6 }}>
                {now.description}
              </div>
            )}
          </div>
        ) : (
          <div className="muted" style={{ marginTop: 14 }}>Select a lecture to play.</div>
        )}
      </div>

      {/* Results list */}
      <div className="card" style={{ textAlign: "left" }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>
          Results{" "}
          <span className="muted">({items.length})</span>
          {(speaker || mosque || q) && (
            <button
              onClick={() => { setSpeaker(""); setMosque(""); setQ(""); }}
              style={{
                marginLeft: 12, fontSize: 12, color: "#6b7280",
                background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 400
              }}
            >
              Clear filters ×
            </button>
          )}
        </div>

        <div className="grid">
          {items.map((it) => (
            <div className="row" key={it.id}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 650, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {it.title}
                </div>
                <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                  <span>{it.speaker}</span>
                  <span> · </span>
                  <span>{it.date}</span>
                  <span> · </span>
                  <span>{(it.size / 1024 / 1024).toFixed(1)} MB</span>
                  {it.mosque && (
                    <span
                      onClick={() => setMosque(it.mosque)}
                      title={`Filter by ${formatMosque(it.mosque)}`}
                      role="button"
                      tabIndex={0}
                      style={{
                        cursor: "pointer",
                        display: "inline-block",
                        marginLeft: 8,
                        padding: "1px 6px",
                        background: "#f0f9ff",
                        color: "#0369a1",
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      {formatMosque(it.mosque)}
                    </span>
                  )}
                </div>
                {it.description && (
                  <div className="muted" style={{ fontSize: 12, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {it.description}
                  </div>
                )}
              </div>

              <button className="btn" onClick={() => setNow(it)} style={{ flexShrink: 0 }}>
                ▶ Play
              </button>
            </div>
          ))}
          {!loading && items.length === 0 ? (
            <div className="muted" style={{ padding: "16px 0", textAlign: "center" }}>
              No lectures found.{" "}
              {(speaker || mosque || q) && (
                <button
                  onClick={() => { setSpeaker(""); setMosque(""); setQ(""); }}
                  style={{ color: "#0b0b0c", fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0 }}
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

