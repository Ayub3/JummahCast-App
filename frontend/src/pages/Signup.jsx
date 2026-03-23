import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function PasswordStrengthIndicator({ password }) {
  const getStrength = (pw) => {
    if (!pw) return { level: 0, text: '', color: '#e5e7eb' };
    
    let strength = 0;
    if (pw.length >= 8) strength++;
    if (pw.length >= 12) strength++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) strength++;
    if (/\d/.test(pw)) strength++;
    if (/[^a-zA-Z0-9]/.test(pw)) strength++;

    if (strength <= 1) return { level: 1, text: 'Weak', color: '#ef4444' };
    if (strength <= 3) return { level: 2, text: 'Fair', color: '#f59e0b' };
    if (strength <= 4) return { level: 3, text: 'Good', color: '#3b82f6' };
    return { level: 4, text: 'Strong', color: '#10b981' };
  };

  const strength = getStrength(password);

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ 
        display: 'flex', 
        gap: 4, 
        marginBottom: 4 
      }}>
        {[1, 2, 3, 4].map(level => (
          <div
            key={level}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              background: level <= strength.level ? strength.color : '#e5e7eb',
              transition: 'background 0.2s'
            }}
          />
        ))}
      </div>
      {password && (
        <div style={{ fontSize: 12, color: strength.color }}>
          {strength.text}
        </div>
      )}
    </div>
  );
}

export default function Signup() {
  const navigate = useNavigate();
  const { signup, socialLogin } = useAuth();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mosque, setMosque] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const validateForm = () => {
    if (!name.trim()) {
      setError("Please enter your name");
      return false;
    }
    if (!email.trim()) {
      setError("Please enter your email");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      return false;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return false;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    return true;
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!validateForm()) return;
    setLoading(true);

    try {
      await signup(email, password, name, mosque.trim() || undefined);
      navigate("/library", { replace: true });
    } catch (err) {
      setError(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  const handleSocialLogin = async (provider) => {
    setError("");
    try {
      await socialLogin(provider);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="grid" style={{ maxWidth: 520, margin: "0 auto" }}>
      <div className="card" style={{ textAlign: "left" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>Create your account</div>
            <div className="muted" style={{ marginTop: 6 }}>
              Join JummahCast to access the full sermon library
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
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            type="text"
            autoComplete="name"
            disabled={loading}
            required
          />

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

          <div>
            <input
              className="input"
              placeholder="Password (min 8 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="new-password"
              disabled={loading}
              required
            />
            <PasswordStrengthIndicator password={password} />
          </div>

          <input
            className="input"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            type="password"
            autoComplete="new-password"
            disabled={loading}
            required
          />

          {/* Optional mosque affiliation - grants admin access */}
          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 14, marginTop: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
              Mosque / Organisation{" "}
              <span style={{ fontWeight: 400, color: '#6b7280' }}>(optional – admins only)</span>
            </div>
            <input
              className="input"
              placeholder="e.g. green-lane-masjid or East London Mosque"
              value={mosque}
              onChange={(e) => setMosque(e.target.value)}
              type="text"
              disabled={loading}
            />
            {mosque && (
              <div style={{ marginTop: 4, fontSize: 12, color: '#0369a1' }}>
                ℹ️ Providing a mosque affiliation grants admin upload access for that mosque.
              </div>
            )}
          </div>

          <button className="btn" type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Sign up'}
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

          <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>
            🔐 Social login requires AWS Cognito setup in production
          </div>

          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <span className="muted" style={{ fontSize: 14 }}>Already have an account? </span>
            <Link to="/login" style={{ fontSize: 14, color: '#0b0b0c', fontWeight: 600 }}>
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
