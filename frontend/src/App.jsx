import { Routes, Route, Link, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { ProtectedRoute } from "./components/ProtectedRoute.jsx";
import Landing from "./pages/Landing.jsx";
import AdminLogin from "./pages/AdminLogin.jsx";
import AdminUpload from "./pages/AdminUpload.jsx";

function AppContent() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const isLanding = location.pathname === "/";

  return (
    <div className={isLanding ? "" : "container"}>
      {!isLanding ? (
        <div className="nav">
          <div className="brand">
            <Link to="/" style={{ color: "inherit", textDecoration: "none" }}>
              Khutbah Library
            </Link>
            <span className="muted"> · {user ? `${user.name}` : 'local'}</span>
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {user ? (
              <>
                <span className="muted">{user.email}</span>
                <button
                  className="btn secondary"
                  onClick={logout}
                  style={{ padding: '4px 12px', fontSize: '14px' }}
                >
                  Logout
                </button>
              </>
            ) : (
              <Link className="muted" to="/admin/login" style={{ textDecoration: "none" }}>
                Admin login
              </Link>
            )}
          </div>
        </div>
      ) : null}

      <Routes>
        <Route path="/" element={<Landing />} />

        <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
        <Route path="/admin/login" element={<AdminLogin />} />
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

