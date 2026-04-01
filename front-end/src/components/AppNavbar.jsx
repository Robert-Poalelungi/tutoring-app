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
  const dashboardRoute = getDashboardRouteByRole(role);
  const dashboardLabel = getDashboardLabelByRole(role);

  return (
    <header className="site-header">
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
            <Link to={dashboardRoute} className={active === 'dashboard' ? 'active' : ''}>
              <i className="fa-solid fa-table-columns" />
              <span>{dashboardLabel}</span>
            </Link>
          ) : null}
          <Link to="/drive" className={active === 'drive' ? 'active' : ''}>
            <i className="fa-brands fa-google-drive" />
            <span>Drive</span>
          </Link>
        </div>
      </nav>
      <ProfileMenuButton initials={getInitials(user)} active={profileMenuActive} ariaLabel="Profil utilizator" />
    </header>
  );
}

export function AppBottomNav({ active = 'calendar' }) {
  const { isAuthenticated, user } = useAuth();
  const role = user?.role;
  const dashboardRoute = getDashboardRouteByRole(role);
  const dashboardLabel = getDashboardLabelByRole(role);

  return (
    <nav className="bottom-nav" aria-label="Navigare principală">
      <Link to="/calendar" className={`bottom-nav-item ${active === 'calendar' ? 'active' : ''}`}>
        <i className="fa-regular fa-calendar" />
        <span>Calendar</span>
      </Link>
      {isAuthenticated ? (
        <Link to={dashboardRoute} className={`bottom-nav-item ${active === 'dashboard' ? 'active' : ''}`}>
          <i className="fa-solid fa-table-columns" />
          <span>{dashboardLabel}</span>
        </Link>
      ) : null}
      <Link to="/drive" className={`bottom-nav-item ${active === 'drive' ? 'active' : ''}`}>
        <i className="fa-brands fa-google-drive" />
        <span>Drive</span>
      </Link>
    </nav>
  );
}