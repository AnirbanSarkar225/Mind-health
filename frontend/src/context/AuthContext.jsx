import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, setToken, clearToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsVerification, setNeedsVerification] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('gns_token');
    if (token) {
      api.getMe()
        .then((data) => {
          setUser(data.user);
          if (!data.user.email_verified) {
            setNeedsVerification(true);
          }
        })
        .catch(() => {
          clearToken();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await api.login({ email, password });
    setToken(data.token);
    setUser(data.user);
    setNeedsVerification(data.needsVerification);
    return data;
  }, []);

  const register = useCallback(async (username, email, password) => {
    const data = await api.register({ username, email, password });
    setToken(data.token);
    setUser(data.user);
    setNeedsVerification(true);
    return data;
  }, []);

  const verifyOTP = useCallback(async (code) => {
    const data = await api.verifyOTP(code);
    if (data.user) {
      setUser(data.user);
    } else {
      setUser((prev) => (prev ? { ...prev, email_verified: 1 } : null));
    }
    setNeedsVerification(false);
    return data;
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    setNeedsVerification(false);
  }, []);

  const isAuthenticated = !!user && !needsVerification && Boolean(user.email_verified);

  return (
    <AuthContext.Provider
      value={{
        user, loading, isAuthenticated, needsVerification,
        login, register, verifyOTP, logout, setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
