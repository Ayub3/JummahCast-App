import { Routes, Route, Link, Navigate, useLocation } from "react-router-dom";
import Landing from "./pages/Landing.jsx";
import AdminLogin from "./pages/AdminLogin.jsx";
import AdminUpload from "./pages/AdminUpload.jsx";

export default function App() {
  const location = useLocation();
  const isLanding = location.pathname === "/";

  return (
    <div className={isLanding ? "" : "container"}>
      {!isLanding ? (
        <div className="nav">
          <div className="brand">
            <Link to="/" style={{ color: "inherit", textDecoration: "none" }}>
              Khutbah Library
            </Link>
            <span className="muted"> · local</span>
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Link className="muted" to="/admin/login" style={{ textDecoration: "none" }}>
              Admin login
            </Link>
          </div>
        </div>
      ) : null}

      <Routes>
        <Route path="/" element={<Landing />} />

        <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/upload" element={<AdminUpload />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

