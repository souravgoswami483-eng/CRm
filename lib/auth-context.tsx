'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, StudioSettings } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  theme: 'dark' | 'light';
  settings: StudioSettings | null;
  login: (userData: User) => void;
  logout: () => Promise<void>;
  toggleTheme: () => void;
  quickSwitchUser: (type: 'admin' | 'client1' | 'client2' | 'client3') => void;
  refreshSettings: () => Promise<void>;
  checkSession: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  theme: 'dark',
  settings: null,
  login: () => {},
  logout: async () => {},
  toggleTheme: () => {},
  quickSwitchUser: () => {},
  refreshSettings: async () => {},
  checkSession: async () => null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [settings, setSettings] = useState<StudioSettings | null>(null);

  const refreshSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
      }
    } catch (e) {
      console.error('Failed to load studio settings', e);
    }
  };

  const checkSession = async (): Promise<User | null> => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
          localStorage.setItem('vortex_user', JSON.stringify(data.user));
          return data.user;
        }
      }
      // If unauthorized or error, clear user state
      setUser(null);
      localStorage.removeItem('vortex_user');
      return null;
    } catch {
      setUser(null);
      localStorage.removeItem('vortex_user');
      return null;
    }
  };

  useEffect(() => {
    // 1. Restore theme
    const savedTheme = localStorage.getItem('vortex_theme') as 'dark' | 'light';
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      }
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }

    // 2. Validate real server session
    checkSession().finally(() => {
      refreshSettings();
      setLoading(false);
    });
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('vortex_user', JSON.stringify(userData));
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Error logging out', err);
    } finally {
      setUser(null);
      localStorage.removeItem('vortex_user');
      window.location.href = '/login';
    }
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('vortex_theme', next);
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  };

  const quickSwitchUser = () => {
    // Quick switch disabled per security requirements
    console.warn('Quick switch is disabled for security.');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        theme,
        settings,
        login,
        logout,
        toggleTheme,
        quickSwitchUser,
        refreshSettings,
        checkSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
