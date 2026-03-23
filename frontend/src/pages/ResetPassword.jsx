import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { resetPassword } = useAuth();
  
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (!tokenFromUrl) {
      setError("Invalid or missing reset token. Please request a new password reset link.");
    } else {
      setToken(tokenFromUrl);
    }
  }, [searchParams]);

  const validateForm = () => {
    if (!token) {
      setError("Invalid reset token");
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

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await resetPassword(token, password);
      setSuccess(true);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 2000);
    } catch (err) {
      setError(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  }

  if (!token && !error) {
    return null; // Loading state
  }

  return (
    <div className="grid" style={{ maxWidth: 520, margin: "0 auto" }}>
      <div className="card" style={{ textAlign: "left" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>Set new password</div>
            <div className="muted" style={{ marginTop: 6 }}>
              Choose a strong password for your account
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
            {error.includes('token') && (
              <div style={{ marginTop: 8 }}>
                <Link to="/forgot-password" style={{ color: '#dc2626', fontWeight: 600 }}>
                  Request a new reset link →
                </Link>
              </div>
            )}
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
            <strong>Password reset successful!</strong>
            <div style={{ marginTop: 4 }}>
              Redirecting to login...
            </div>
          </div>
        )}
      </div>

      {!success && token && (
        <div className="card" style={{ textAlign: "left" }}>
          <form onSubmit={handleSubmit} className="grid">
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: 6, 
                fontSize: 14, 
                fontWeight: 600 
              }}>
                New Password
              </label>
              <input
                className="input"
                placeholder="Enter new password (min 8 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                autoComplete="new-password"
                disabled={loading}
                required
              />
              <PasswordStrengthIndicator password={password} />
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: 6, 
                fontSize: 14, 
                fontWeight: 600 
              }}>
                Confirm Password
              </label>
              <input
                className="input"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                type="password"
                autoComplete="new-password"
                disabled={loading}
                required
              />
            </div>

            <button className="btn" type="submit" disabled={loading}>
              {loading ? 'Resetting password...' : 'Reset password'}
            </button>

            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <Link to="/login" className="muted" style={{ fontSize: 14, textDecoration: 'none' }}>
                ← Back to login
              </Link>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
