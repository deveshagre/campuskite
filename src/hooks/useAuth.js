import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import * as authService from '../services/authService';

/**
 * Custom hook to access authentication context.
 * Provides graceful fallback when rendered outside of AuthProvider.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  const [fallbackUser, setFallbackUser] = useState(null);

  useEffect(() => {
    if (!context) {
      authService.getCurrentUser().then((u) => setFallbackUser(u)).catch(() => {});
    }
  }, [context]);

  if (context) {
    return context;
  }

  return {
    user: fallbackUser,
    userId: fallbackUser?.id,
    loading: false,
    isAuthenticated: !!fallbackUser,
    login: async (email, pw) => authService.login(email, pw),
    logout: () => authService.logout(),
    register: async (name, email, pw) => authService.register(name, email, pw),
    updateProfile: async (updates) => {
      const u = await authService.getCurrentUser();
      if (u) return authService.updateProfile(u.id, updates);
    },
    changePassword: async (oldPw, newPw) => {
      const u = await authService.getCurrentUser();
      if (u) return authService.changePassword(u.id, oldPw, newPw);
    },
  };
}

export default useAuth;
