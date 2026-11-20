'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { API_BASE } from './config';
import type { User } from './types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  reloadUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => {},
  logout: () => {},
  reloadUser: async () => {},
});

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

export function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function clearAuth() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMe = useCallback(async (token: string): Promise<User | null> => {
    try {
      const res = await fetch(`${API_BASE}/auth/me/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }, []);

  const loadUser = useCallback(async () => {
    const token = getAuthToken();
    if (token) {
      const userData = await fetchMe(token);
      if (userData) {
        setUser(userData);
      } else {
        clearAuth();
        setUser(null);
      }
    }
    setIsLoading(false);
  }, [fetchMe]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (username: string, password: string) => {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/auth/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
    } catch {
      throw new Error('Cannot reach the server. Make sure the backend is running on http://localhost:8000');
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || `Login failed (HTTP ${res.status})`);
    }
    const { access, refresh } = await res.json();
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);

    // Try to fetch user info; if it fails (e.g. transient network error),
    // the AuthProvider's useEffect will retry on next render using the
    // token already stored in localStorage — so we never block login.
    const userData = await fetchMe(access);
    if (userData) {
      setUser(userData);
    }
    // userData being null is not a fatal error at this point; the tokens
    // are stored and the shell will pick them up on redirect.
  };

  const logout = () => {
    clearAuth();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, reloadUser: loadUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
