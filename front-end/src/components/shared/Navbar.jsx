import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { logout } from "../../services/authService";
import "./Navbar.css";

const Navbar = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    setUser(null);
    navigate("/");
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">Tutoring App</Link>
      </div>

      <div className="navbar-actions">
        {user ? (
          <>
            <Link to="/profile" className="navbar-profile">
              {user.firstName} {user.lastName}
            </Link>
            <button className="navbar-logout" onClick={handleLogout}>
              Deconectare
            </button>
          </>
        ) : (
          <Link to="/login" className="navbar-login-link">
            Autentificare
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
