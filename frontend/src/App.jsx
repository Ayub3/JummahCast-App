import { Routes, Route, Link } from "react-router-dom";
import Library from "./pages/Library.jsx";
import AdminUpload from "./pages/AdminUpload.jsx";

export default function App() {
  return (
    <div className="container">
      <div className="nav">
        <div className="brand">
          <Link to="/" style={{ color: "inherit", textDecoration: "none" }}>
            Khutbah Library
          </Link>
          <span className="muted"> · local</span>
        </div>
        <Link className="muted" to="/admin">Admin</Link>
      </div>

      <Routes>
        <Route path="/" element={<Library />} />
        <Route path="/admin" element={<AdminUpload />} />
      </Routes>
    </div>
  );
}