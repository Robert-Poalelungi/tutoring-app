import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

import CalendarPage from "./pages/CalendarPage/CalendarPage";
import LoginPage from "./pages/LoginPage/LoginPage";
import OnboardingFaculty from "./pages/Onboarding/OnboardingFaculty";
import OnboardingProfile from "./pages/Onboarding/OnboardingProfile";
import OnboardingInterests from "./pages/Onboarding/OnboardingInterests";
import StudentDashboard from "./pages/StudentDashboard/StudentDashboard";
import ProfessorDashboard from "./pages/ProfessorDashboard/ProfessorDashboard";
import ProfilePage from "./pages/ProfilePage/ProfilePage";
import AdminPanel from "./pages/AdminPanel/AdminPanel";

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  if (!user.isProfileCompleted) return <Navigate to="/onboarding" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return children;
};

const OnboardingRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  if (user.isProfileCompleted) return <Navigate to="/" />;
  return children;
};

const App = () => {
  const { loading } = useAuth();
  if (loading) return null;

  return (
    <Routes>
      <Route path="/" element={<CalendarPage />} />
      <Route path="/login" element={<LoginPage />} />

      <Route path="/onboarding" element={<OnboardingRoute><OnboardingFaculty /></OnboardingRoute>} />
      <Route path="/onboarding/profile" element={<OnboardingRoute><OnboardingProfile /></OnboardingRoute>} />
      <Route path="/onboarding/interests" element={<OnboardingRoute><OnboardingInterests /></OnboardingRoute>} />

      <Route path="/dashboard" element={<ProtectedRoute roles={["student"]}><StudentDashboard /></ProtectedRoute>} />
      <Route path="/professor" element={<ProtectedRoute roles={["professor"]}><ProfessorDashboard /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute roles={["admin"]}><AdminPanel /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default App;
