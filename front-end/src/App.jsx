import React, { useEffect } from 'react';
import { Navigate, Routes, Route } from 'react-router-dom';
import { useAuth } from './context/useAuth';
import { settingsApi } from './api/index';
import { getDashboardRouteByRole, normalizeRole } from './utils/navigation';
import Admin from './pages/admin/admin.jsx';
import Calendar from './pages/calendar/calendar.jsx';
import Student from './pages/student/student.jsx';
import Drive from './pages/drive/drive.jsx';
import Login from './pages/login/login.jsx';
import Profesor from './pages/profesor/profesor.jsx';
import Profil from './pages/profil/profil.jsx';
import Setari from './pages/setari/setari.jsx';

function ProtectedRoute({ children, allowedRoles = null }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    const role = normalizeRole(user?.role);
    const normalizedAllowedRoles = allowedRoles.map((entry) => normalizeRole(entry));

    if (!normalizedAllowedRoles.includes(role)) {
      return <Navigate to={getDashboardRouteByRole(role)} replace />;
    }
  }

  return children;
}

function App() {
  useEffect(() => {
    settingsApi.getActiveSession()
      .then(({ activeSession, seasonalTheme }) => {
        document.body.classList.remove('season-winter', 'season-summer');
        if (seasonalTheme !== false) {
          document.body.classList.add(`season-${activeSession}`);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Calendar />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/admin"
        element={(
          <ProtectedRoute allowedRoles={['admin']}>
            <Admin />
          </ProtectedRoute>
        )}
      />
      <Route path="/calendar" element={<Calendar />} />
      <Route
        path="/student"
        element={(
          <ProtectedRoute allowedRoles={['student']}>
            <Student />
          </ProtectedRoute>
        )}
      />
      <Route path="/drive" element={<Drive />} />
      <Route
        path="/profesor"
        element={(
          <ProtectedRoute allowedRoles={['professor']}>
            <Profesor />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/profil"
        element={(
          <ProtectedRoute>
            <Profil />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/setari"
        element={(
          <ProtectedRoute allowedRoles={['student']}>
            <Setari />
          </ProtectedRoute>
        )}
      />
    </Routes>
  );
}

export default App;
