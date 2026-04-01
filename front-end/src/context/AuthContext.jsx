import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api';
import { AuthContext } from './AuthContextObject';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    setIsLoading(true);
    try {
      const currentUser = await authApi.getCurrentUser();
      setUser(currentUser);
      return currentUser;
    } catch (error) {
      if (error.status === 401) {
        setUser(null);
        return null;
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshUser().catch(() => {
      setUser(null);
      setIsLoading(false);
    });
  }, [refreshUser]);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      refreshUser,
      logout,
    }),
    [isLoading, logout, refreshUser, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
