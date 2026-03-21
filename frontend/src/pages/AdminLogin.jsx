import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Redirect if already logged in
  if (isAuthenticated()) {
    const from = location.state?.from?.pathname || "/admin/upload";
    navigate(from, { replace: true });
    return null;
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, pw);
      
      // Redirect to previous page or upload page
      const from = location.state?.from?.pathname || "/admin/upload";
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid" style={{ maxWidth: 520, margin: "0 auto" }}>
      <div className="card" style={{ textAlign: "left" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>Admin login</div>
            <div className="muted" style={{ marginTop: 6 }}>
              Local dev credentials: admin@jummahcast.local / admin123
            </div>
          </div>

          <Link className="muted" to="/" style={{ textDecoration: "none" }}>
            Back to site
          </Link>
        </div>

        {error && (
          <div style={{ marginTop: 12, padding: 12, background: '#fee', borderRadius: 4, color: '#c00' }}>
            {error}
          </div>
        )}
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
            disabled={loading}
            required
          />
          <input
            className="input"
            placeholder="Password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            type="password"
            autoComplete="current-password"
            disabled={loading}
            required
          />

          <button className="btn" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          <div className="muted" style={{ fontSize: 12 }}>
            🔐 In production, this will use AWS Cognito authentication.
          </div>
        </form>
      </div>
    </div>
  );
}
