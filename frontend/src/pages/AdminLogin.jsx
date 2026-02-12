import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");

  function submit(e) {
    e.preventDefault();
    // MVP: auth not wired yet -> go straight to upload
    navigate("/admin/upload");
  }

  return (
    <div className="grid" style={{ maxWidth: 520, margin: "0 auto" }}>
      <div className="card" style={{ textAlign: "left" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>Admin login</div>
            <div className="muted" style={{ marginTop: 6 }}>
              Auth isn’t connected yet — Sign in takes you to Upload.
            </div>
          </div>

          <Link className="muted" to="/" style={{ textDecoration: "none" }}>
            Back to site
          </Link>
        </div>
      </div>

      <div className="card" style={{ textAlign: "left" }}>
        <form onSubmit={submit} className="grid">
          <input
            className="input"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="email"
          />
          <input
            className="input"
            placeholder="Password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            type="password"
            autoComplete="current-password"
          />

          <button className="btn" type="submit">
            Sign in
          </button>

          <div className="muted" style={{ fontSize: 12 }}>
            Coming next: Cognito + route protection for <code>/admin/upload</code>.
          </div>
        </form>
      </div>
    </div>
  );
}
