export const normalizeRole = (role) => {
  if (role === 'admin') return 'admin';
  if (role === 'profesor') return 'professor';
  if (role === 'professor') return 'professor';
  if (role === 'student') return 'student';
  return 'guest';
};

export const getDashboardRouteByRole = (role) => {
  const normalizedRole = normalizeRole(role);

  if (normalizedRole === 'admin') return '/admin';
  if (normalizedRole === 'professor') return '/profesor';
  return '/student';
};

export const getDashboardLabelByRole = (role) => {
  return 'Dashboard';
};

export const getLogoRouteByRole = (role) => {
  const normalizedRole = normalizeRole(role);

  if (normalizedRole === 'admin') return '/admin';
  if (normalizedRole === 'professor') return '/profesor';
  return '/calendar';
};

export const getRoleLabel = (role) => {
  const normalizedRole = normalizeRole(role);
  if (normalizedRole === 'professor') return 'profesor';
  if (normalizedRole === 'student') return 'student';
  if (normalizedRole === 'admin') return 'admin';
  return 'utilizator';
};