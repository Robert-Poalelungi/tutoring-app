import React from 'react';
import { Navigate, Routes, Route } from 'react-router-dom';
import { useAuth } from './context/useAuth';
import { getDashboardRouteByRole, normalizeRole } from './utils/navigation';
import Admin from './pages/admin/admin.jsx';
import Calendar from './pages/calendar/calendar.jsx';
import Dashboard from './pages/dashboard/dashboard.jsx';
import Drive from './pages/drive/drive.jsx';
import Login from './pages/login/login.jsx';
import Profesor from './pages/profesor/profesor.jsx';
import Profil from './pages/profil/profil.jsx';

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
        path="/dashboard"
        element={(
          <ProtectedRoute allowedRoles={['student']}>
            <Dashboard />
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
    </Routes>
  );
}

export default App;
