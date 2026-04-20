import React, { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

function ProfileMenuButton({ initials = 'PR', active = false, ariaLabel = 'Profil utilizator' }) {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, isLoading, logout } = useAuth();
  const menuRef = useRef(null);
  const popupId = useId();

  useEffect(() => {
    if (!isAuthenticated) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!menuRef.current || menuRef.current.contains(event.target)) {
        return;
      }
      setIsOpen(false);
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown, { passive: true });
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAuthenticated]);

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
  };

  if (isLoading || !isAuthenticated) {
    return (
      <Link to="/login" className="top-auth-btn" aria-label="Conectează-te">
        Conectează-te
      </Link>
    );
  }

  return (
    <div className="profile-menu" ref={menuRef}>
      <button
        type="button"
        className={`top-user-btn${active ? ' active' : ''}`}
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={popupId}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className="user-initials">{initials}</span>
      </button>

      <div className="profile-popup" id={popupId} hidden={!isOpen} role="menu" aria-label="Meniu profil">
        <Link to="/profil" className="profile-popup-btn" role="menuitem" onClick={() => setIsOpen(false)}>
          Profil
        </Link>
        <Link to="/setari" className="profile-popup-btn" role="menuitem" onClick={() => setIsOpen(false)}>
          Setări
        </Link>
        <Link
          to="/login"
          className="profile-popup-btn"
          role="menuitem"
          onClick={(event) => {
            event.preventDefault();
            handleLogout().finally(() => {
              window.location.assign('/login');
            });
          }}
        >
          Deconectare
        </Link>
      </div>
    </div>
  );
}

export default ProfileMenuButton;
