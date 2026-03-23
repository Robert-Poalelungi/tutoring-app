import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { logout } from "../../services/authService";
import "./Navbar.css";

const roleDashboard = {
  student: "/dashboard",
  professor: "/professor",
  admin: "/admin",
};

const roleLabel = {
  student: "Student",
  professor: "Profesor",
  admin: "Admin",
};

const Navbar = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const handleLogout = async () => {
    try { await logout(); } catch (_) {}
    setUser(null);
    navigate("/");
  };

  const firstName = user?.name?.split(" ")[0] || "";
  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  return (
    <>
      <nav className={`navbar ${scrolled ? "navbar--scrolled" : ""}`}>
        <Link to="/" className="navbar__logo">
          <div className="navbar__logo-icon">🎓</div>
          <span className="navbar__logo-text">Tutoring<span>App</span></span>
        </Link>

        {user ? (
          <>
            <div className="navbar__desktop">
              <Link
                to={roleDashboard[user.role] || "/"}
                className={`navbar__link ${location.pathname === roleDashboard[user.role] ? "navbar__link--active" : ""}`}
              >
                Dashboard
              </Link>
              <Link
                to="/"
                className={`navbar__link ${location.pathname === "/" ? "navbar__link--active" : ""}`}
              >
                Calendar
              </Link>
              <Link
                to="/profile"
                className={`navbar__link ${location.pathname === "/profile" ? "navbar__link--active" : ""}`}
              >
                Profil
              </Link>
              <div className="navbar__separator" />
              <span className={`badge badge--${user.role}`}>{roleLabel[user.role]}</span>
              <button className="navbar__avatar" onClick={() => setMenuOpen((v) => !v)}>
                {initials}
              </button>
            </div>

            <button
              className="navbar__hamburger"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Meniu"
            >
              <div className="navbar__avatar navbar__avatar--sm">{initials}</div>
              <span className="navbar__chevron">{menuOpen ? "✕" : "☰"}</span>
            </button>
          </>
        ) : (
          <Link to="/login" className="btn btn--primary btn--sm">
            Autentificare
          </Link>
        )}
      </nav>

      {menuOpen && user && (
        <>
          <div className="navbar__backdrop" onClick={() => setMenuOpen(false)} />
          <div className="navbar__dropdown">
            <div className="navbar__dropdown-user">
              <div className="navbar__dropdown-avatar">{initials}</div>
              <div>
                <p className="navbar__dropdown-name">{user.name}</p>
                <p className="navbar__dropdown-email">{user.email}</p>
              </div>
              <span className={`badge badge--${user.role}`}>{roleLabel[user.role]}</span>
            </div>
            <div className="navbar__dropdown-links">
              <Link to="/" className="navbar__dropdown-link" onClick={() => setMenuOpen(false)}>
                <span>📅</span> Calendar
              </Link>
              <Link to={roleDashboard[user.role] || "/"} className="navbar__dropdown-link" onClick={() => setMenuOpen(false)}>
                <span>🏠</span> Dashboard
              </Link>
              <Link to="/profile" className="navbar__dropdown-link" onClick={() => setMenuOpen(false)}>
                <span>👤</span> Profil
              </Link>
            </div>
            <button className="navbar__dropdown-logout" onClick={handleLogout}>
              Ieșire din cont
            </button>
          </div>
        </>
      )}
    </>
  );
};

export default Navbar;
