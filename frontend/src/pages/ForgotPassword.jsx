import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ForgotPassword() {
  const { requestPasswordReset } = useAuth();
  
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);

    try {
      await requestPasswordReset(email);
      setSuccess(true);
      setEmail("");
    } catch (err) {
      setError(err.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid" style={{ maxWidth: 520, margin: "0 auto" }}>
      <div className="card" style={{ textAlign: "left" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>Reset your password</div>
            <div className="muted" style={{ marginTop: 6 }}>
              Enter your email and we'll send you a reset link
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

        {success && (
          <div style={{ 
            marginTop: 12, 
            padding: 12, 
            background: '#d1fae5', 
            borderRadius: 8, 
            color: '#065f46',
            fontSize: 14
          }}>
            <strong>Check your email!</strong>
            <div style={{ marginTop: 4 }}>
              We've sent password reset instructions to your email address.
              If you don't see it, check your spam folder.
            </div>
          </div>
        )}
      </div>

      <div className="card" style={{ textAlign: "left" }}>
        <form onSubmit={handleSubmit} className="grid">
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: 6, 
              fontSize: 14, 
              fontWeight: 600 
            }}>
              Email address
            </label>
            <input
              className="input"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
              disabled={loading}
              required
            />
          </div>

          <button className="btn" type="submit" disabled={loading || success}>
            {loading ? 'Sending...' : 'Send reset link'}
          </button>

          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <Link to="/login" className="muted" style={{ fontSize: 14, textDecoration: 'none' }}>
              ← Back to login
            </Link>
          </div>

          <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>
            💡 In local dev mode, check the server console for the reset link.
            In production, this sends an email via AWS SES.
          </div>
        </form>
      </div>
    </div>
  );
}
