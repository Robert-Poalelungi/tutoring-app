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

const Navbar = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [popupOpen, setPopupOpen] = useState(false);

  useEffect(() => { setPopupOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (!popupOpen) return;
    const close = (e) => { if (!e.target.closest(".navbar__user-wrap")) setPopupOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [popupOpen]);

  const handleLogout = async () => {
    try { await logout(); } catch (_) {}
    setUser(null);
    navigate("/");
  };

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : null;

  const dashboardPath = user ? (roleDashboard[user.role] || "/") : null;

  return (
    <header className="navbar">
      <nav className="navbar__inner">
        <Link to="/" className="navbar__logo">Tutoring App</Link>

        <div className="navbar__links">
          <Link
            to="/"
            className={`navbar__link ${location.pathname === "/" ? "navbar__link--active" : ""}`}
          >
            <i className="fa-regular fa-calendar" />
            <span>Calendar</span>
          </Link>

          {user && dashboardPath && (
            <Link
              to={dashboardPath}
              className={`navbar__link ${location.pathname === dashboardPath ? "navbar__link--active" : ""}`}
            >
              <i className="fa-solid fa-table-columns" />
              <span>Dashboard</span>
            </Link>
          )}
        </div>

        {user && (
          <div className="navbar__user-wrap">
            <button
              className={`navbar__avatar ${popupOpen ? "navbar__avatar--active" : ""}`}
              onClick={() => setPopupOpen((o) => !o)}
              aria-label="Meniu utilizator"
            >
              <span className="navbar__initials">{initials || "?"}</span>
            </button>

            {popupOpen && (
              <div className="navbar__popup">
                <Link to="/profile" className="navbar__popup-btn">
                  <i className="fa-solid fa-user" /> Profil
                </Link>
                <button className="navbar__popup-btn navbar__popup-btn--danger" onClick={handleLogout}>
                  <i className="fa-solid fa-right-from-bracket" /> Deconectare
                </button>
              </div>
            )}
          </div>
        )}
      </nav>
    </header>
  );
};

export default Navbar;
