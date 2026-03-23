import { Routes, Route, Link, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { ProtectedRoute } from "./components/ProtectedRoute.jsx";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import Library from "./pages/Library.jsx";
import AdminUpload from "./pages/AdminUpload.jsx";

function AppContent() {
  const location = useLocation();
  const { user, logout, hasRole } = useAuth();
  const isLanding = location.pathname === "/";
  const isAdmin = hasRole("admin");

  return (
    <div className={isLanding ? "" : "container"}>
      {!isLanding ? (
        <div className="nav">
          <div className="brand">
            <Link to="/" style={{ color: "inherit", textDecoration: "none" }}>
              Khutbah Library
            </Link>
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {user ? (
              <>
                <Link to="/library" className="muted" style={{ textDecoration: "none", fontSize: 14 }}>
                  Library
                </Link>

                {isAdmin && (
                  <Link to="/admin/upload" style={{ textDecoration: "none" }}>
                    <span style={{
                      padding: "3px 10px",
                      background: "#e8f5e9",
                      color: "#2e7d32",
                      borderRadius: 4,
                      fontSize: 13,
                      fontWeight: 600,
                    }}>
                      + Upload
                    </span>
                  </Link>
                )}

                <span className="muted" style={{ fontSize: 14 }}>{user.name || user.email}</span>

                {isAdmin && user.mosque && (
                  <span style={{
                    padding: "2px 8px",
                    background: "#f0f9ff",
                    color: "#0369a1",
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 600,
                  }}>
                    {user.mosque.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                  </span>
                )}

                <button
                  className="btn secondary"
                  onClick={logout}
                  style={{ padding: "4px 12px", fontSize: "14px" }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link className="muted" to="/login" style={{ textDecoration: "none", fontSize: 14 }}>
                  Log in
                </Link>
                <Link className="btn" to="/signup" style={{ textDecoration: "none", fontSize: 14, padding: "4px 14px" }}>
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      ) : null}

      <Routes>
        <Route path="/" element={<Landing />} />

        {/* Auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Legacy redirect – preserve state so login can redirect correctly */}
        <Route path="/admin/login" element={<Navigate to="/login" replace />} />
        <Route path="/admin" element={<Navigate to="/library" replace />} />

        {/* Library – requires authentication (any role) */}
        <Route
          path="/library"
          element={
            <ProtectedRoute>
              <Library />
            </ProtectedRoute>
          }
        />

        {/* Admin upload – requires admin role */}
        <Route
          path="/admin/upload"
          element={
            <ProtectedRoute requireRole="admin">
              <AdminUpload />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

