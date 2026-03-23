import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, socialLogin } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Redirect if already logged in
  if (isAuthenticated()) {
    const from = location.state?.from?.pathname || "/library";
    navigate(from, { replace: true });
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      
      // Redirect to previous page or library
      const from = location.state?.from?.pathname || "/library";
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  const handleSocialLogin = async (provider) => {
    setError("");
    try {
      await socialLogin(provider);
      const from = location.state?.from?.pathname || "/library";
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="grid" style={{ maxWidth: 520, margin: "0 auto" }}>
      <div className="card" style={{ textAlign: "left" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>Welcome back</div>
            <div className="muted" style={{ marginTop: 6 }}>
              Sign in to your JummahCast account
            </div>
          </div>

          <Link className="muted" to="/" style={{ textDecoration: "none" }}>
            Back to site
          </Link>
        </div>

        {error && (
          <div style={{ 
            marginTop: 12, 
            padding: 12, 
            background: '#fee2e2', 
            borderRadius: 8, 
            color: '#dc2626',
            fontSize: 14
          }}>
            {error}
          </div>
        )}
      </div>

      <div className="card" style={{ textAlign: "left" }}>
        <form onSubmit={handleSubmit} className="grid">
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="current-password"
            disabled={loading}
            required
          />

          <div style={{ textAlign: 'right' }}>
            <Link 
              to="/forgot-password" 
              style={{ fontSize: 14, color: '#6b7280', textDecoration: 'none' }}
            >
              Forgot password?
            </Link>
          </div>

          <button className="btn" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          <div style={{ textAlign: 'center', position: 'relative', margin: '8px 0' }}>
            <div style={{ 
              position: 'absolute', 
              top: '50%', 
              left: 0, 
              right: 0, 
              height: 1, 
              background: '#e5e7eb' 
            }} />
            <span style={{ 
              position: 'relative', 
              background: 'white', 
              padding: '0 12px', 
              color: '#6b7280',
              fontSize: 14
            }}>
              OR
            </span>
          </div>

          <button
            type="button"
            className="btn social-btn google-btn"
            onClick={() => handleSocialLogin('google')}
            disabled={loading}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" style={{ marginRight: 8 }}>
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
              <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.335z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
            </svg>
            Continue with Google
          </button>

          <button
            type="button"
            className="btn social-btn facebook-btn"
            onClick={() => handleSocialLogin('facebook')}
            disabled={loading}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2" style={{ marginRight: 8 }}>
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Continue with Facebook
          </button>

          <div className="muted" style={{ fontSize: 12 }}>
            🔐 Social login requires AWS Cognito setup in production
          </div>

          <div style={{ 
            marginTop: 12, 
            padding: 12, 
            background: '#f3f4f6', 
            borderRadius: 8,
            fontSize: 13
          }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>💡 Local Dev Accounts</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', paddingBottom: 4, color: '#6b7280', fontWeight: 600 }}>Email</th>
                  <th style={{ textAlign: 'left', paddingBottom: 4, color: '#6b7280', fontWeight: 600 }}>Password</th>
                  <th style={{ textAlign: 'left', paddingBottom: 4, color: '#6b7280', fontWeight: 600 }}>Role</th>
                  <th style={{ textAlign: 'left', paddingBottom: 4, color: '#6b7280', fontWeight: 600 }}>Mosque</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { email: 'admin@jummahcast.local',  pw: 'admin123', role: 'admin', mosque: 'Green Lane Masjid' },
                  { email: 'admin2@jummahcast.local', pw: 'admin123', role: 'admin', mosque: 'East London Mosque' },
                  { email: 'user@jummahcast.local',   pw: 'user123',  role: 'user',  mosque: '—' },
                  { email: 'user2@jummahcast.local',  pw: 'user123',  role: 'user',  mosque: '—' },
                ].map(u => (
                  <tr key={u.email} style={{ cursor: 'pointer' }}
                      onClick={() => { setEmail(u.email); setPassword(u.pw); }}>
                    <td style={{ padding: '3px 0', color: '#0b0b0c' }}>
                      <code style={{ background: '#e5e7eb', padding: '1px 5px', borderRadius: 3 }}>{u.email}</code>
                    </td>
                    <td style={{ padding: '3px 0', paddingLeft: 6 }}>
                      <code style={{ background: '#e5e7eb', padding: '1px 5px', borderRadius: 3 }}>{u.pw}</code>
                    </td>
                    <td style={{ padding: '3px 0', paddingLeft: 6 }}>
                      <span style={{
                        padding: '1px 6px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                        background: u.role === 'admin' ? '#e8f5e9' : '#f3f4f6',
                        color: u.role === 'admin' ? '#2e7d32' : '#6b7280',
                      }}>{u.role}</span>
                    </td>
                    <td style={{ padding: '3px 0', paddingLeft: 6, color: '#6b7280' }}>{u.mosque}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="muted" style={{ marginTop: 6, fontSize: 11 }}>↑ Click a row to auto-fill credentials</div>
          </div>

          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <span className="muted" style={{ fontSize: 14 }}>Don't have an account? </span>
            <Link to="/signup" style={{ fontSize: 14, color: '#0b0b0c', fontWeight: 600 }}>
              Sign up
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
