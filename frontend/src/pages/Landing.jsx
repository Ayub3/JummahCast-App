import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Library from "./Library.jsx";

export default function Landing() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const scrollToHash = () => {
      const id = window.location.hash?.replace("#", "");
      if (!id || id === "top") {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    scrollToHash();
    window.addEventListener("hashchange", scrollToHash);
    return () => window.removeEventListener("hashchange", scrollToHash);
  }, [location.key]);

  function goSection(id) {
    navigate(`/#${id}`);
  }

  return (
    <div style={{ minHeight: "100vh" }}>
      <LandingNav onSection={goSection} />

      {/* HERO */}
      <header style={heroWrap} id="top">
        <div className="container" style={{ paddingTop: 34, paddingBottom: 16 }}>
          <h1 style={{ margin: 0, fontSize: 42, letterSpacing: -0.6 }}>Khutbah Library</h1>
          <p style={{ marginTop: 10, fontSize: 16, opacity: 0.8, maxWidth: 720 }}>
            Listen to weekly khutbahs and Islamic talks. Login with your account to access admin features.
          </p>

          <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
            <button className="btn" onClick={() => goSection("lectures")}>
              Browse lectures
            </button>
            <Link className="btn secondary" to="/login" style={{ textDecoration: "none" }}>
              Login
            </Link>
          </div>
        </div>
      </header>

      {/* ABOUT */}
      <section id="about" style={sectionWrap}>
        <div className="container" style={{ paddingTop: 18, paddingBottom: 18 }}>
          <div className="card" style={{ textAlign: "left" }}>
            <h2 style={{ marginTop: 0 }}>About</h2>
            <p style={{ opacity: 0.85, lineHeight: 1.6 }}>
              A modern platform for streaming and managing Islamic lectures. Features role-based access control:
              all users can browse and listen, while admin users can upload new content.
            </p>
            <p style={{ opacity: 0.85, lineHeight: 1.6, marginBottom: 0 }}>
              Built with environment-aware architecture - runs locally with SQLite and file storage, 
              seamlessly switches to AWS (Cognito, RDS, S3) in production without code changes.
            </p>
          </div>
        </div>
      </section>

      {/* LECTURES */}
      <section id="lectures" style={sectionWrap}>
        <div className="container" style={{ paddingTop: 18, paddingBottom: 36 }}>
          <div style={{ textAlign: "left", marginBottom: 10 }}>
            <h2 style={{ margin: 0 }}>Lectures</h2>
            <div className="muted" style={{ marginTop: 6 }}>
              Search, filter and play.
            </div>
          </div>

          {/* Reuse your existing Library page as the lectures section */}
          <Library />
        </div>
      </section>

      <footer style={{ padding: "18px 0 30px" }}>
        <div className="container">
          <div className="muted">© {new Date().getFullYear()} Khutbah Library</div>
        </div>
      </footer>
    </div>
  );
}

function LandingNav({ onSection }) {
  return (
    <div className="landingNav">
      <div className="container" style={{ paddingTop: 14, paddingBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={() => onSection("top")}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontWeight: 800,
                padding: 0,
                fontSize: 14,
              }}
              aria-label="Go to top"
            >
              Khutbah Library
            </button>
            <span className="muted">· local</span>
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <button onClick={() => onSection("about")} className="linkBtn">
              About
            </button>
            <button onClick={() => onSection("lectures")} className="linkBtn">
              Lectures
            </button>
            <Link className="btn secondary" to="/admin/login" style={{ textDecoration: "none", padding: "8px 12px" }}>
              Admin login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

const heroWrap = {
  borderBottom: "1px solid #f1f1f1",
};

const sectionWrap = {
  background: "#ffffff",
};
