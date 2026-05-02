import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { getDashboardLabelByRole, getDashboardRouteByRole, getLogoRouteByRole } from '../utils/navigation';
import ProfileMenuButton from './ProfileMenuButton';

const getInitials = (user) => {
  if (!user) return 'PR';
  const first = user.firstName?.[0] || '';
  const last = user.lastName?.[0] || '';
  return `${first}${last}`.toUpperCase() || 'PR';
};

export function AppNavbar({ active = 'calendar', profileMenuActive = false }) {
  const { isAuthenticated, user } = useAuth();
  const role = user?.role;
  const logoRoute = getLogoRouteByRole(role);
  const studentRoute = getDashboardRouteByRole(role);
  const studentLabel = getDashboardLabelByRole(role);

  return (
    <>
      <header className="site-header">
        <div className="navbar-row">
          <nav className="navbar">
            <div className="nav-logo">
              <Link to={logoRoute} className="logo-text">
                Tutoring App
              </Link>
            </div>
            <div className="links">
              <Link to="/calendar" className={active === 'calendar' ? 'active' : ''}>
                <i className="fa-regular fa-calendar" />
                <span>Calendar</span>
              </Link>
              {isAuthenticated ? (
                <Link to={studentRoute} className={active === 'student' ? 'active' : ''}>
                  <i className="fa-solid fa-table-columns" />
                  <span>{studentLabel}</span>
                </Link>
              ) : null}
              <Link to="/drive" className={active === 'drive' ? 'active' : ''}>
                <i className="fa-brands fa-google-drive" />
                <span>Drive</span>
              </Link>
            </div>
          </nav>
          <ProfileMenuButton initials={getInitials(user)} active={profileMenuActive} ariaLabel="Profil utilizator" />
        </div>
      </header>
      <div className="mobile-page-title">Tutoring App</div>
    </>
  );
}

export function AppBottomNav({ active = 'calendar' }) {
  const { isAuthenticated, user } = useAuth();
  const role = user?.role;
  const studentRoute = getDashboardRouteByRole(role);
  const studentLabel = getDashboardLabelByRole(role);

  return (
    <nav className="bottom-nav" aria-label="Navigare principală">
      <Link to="/calendar" className={`bottom-nav-item ${active === 'calendar' ? 'active' : ''}`}>
        <i className="fa-regular fa-calendar" />
        <span>Calendar</span>
      </Link>
      {isAuthenticated ? (
        <Link to={studentRoute} className={`bottom-nav-item ${active === 'student' ? 'active' : ''}`}>
          <i className="fa-solid fa-table-columns" />
          <span>{studentLabel}</span>
        </Link>
      ) : null}
      <Link to="/drive" className={`bottom-nav-item ${active === 'drive' ? 'active' : ''}`}>
        <i className="fa-brands fa-google-drive" />
        <span>Drive</span>
      </Link>
    </nav>
  );
}