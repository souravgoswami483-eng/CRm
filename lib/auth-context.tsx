'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, StudioSettings } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  theme: 'dark' | 'light';
  settings: StudioSettings | null;
  login: (userData: User) => void;
  logout: () => void;
  toggleTheme: () => void;
  quickSwitchUser: (type: 'admin' | 'client1' | 'client2' | 'client3') => void;
  refreshSettings: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  theme: 'dark',
  settings: null,
  login: () => {},
  logout: () => {},
  toggleTheme: () => {},
  quickSwitchUser: () => {},
  refreshSettings: async () => {},
});

export const DEMO_ADMIN: User = {
  id: 'user_admin',
  role: 'ADMIN',
  name: 'Sourav Roy',
  email: 'admin@studiovortex.com',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  twoFactorEnabled: false,
};

export const DEMO_CLIENTS: Record<string, User> = {
  client1: {
    id: 'client_1',
    clientId: 'CL-2026-0042',
    role: 'CLIENT',
    name: 'Alex Rivers',
    companyName: 'Zenith Techworks',
    email: 'alex@zenithtech.io',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  },
  client2: {
    id: 'client_2',
    clientId: 'CL-2026-0089',
    role: 'CLIENT',
    name: 'Priya Sharma',
    companyName: 'Lumina Fashion Studio',
    email: 'priya@luminafashion.in',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
  },
  client3: {
    id: 'client_3',
    clientId: 'CL-2026-0104',
    role: 'CLIENT',
    name: 'Marcus Vance',
    companyName: 'Pulse Energy Drink',
    email: 'marcus@pulseenergy.com',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
  },
};

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

  useEffect(() => {
    // Restore user session
    const savedUser = localStorage.getItem('vortex_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to parse saved user', e);
      }
    } else {
      // Default initial session is Admin for quick preview
      setUser(DEMO_ADMIN);
      localStorage.setItem('vortex_user', JSON.stringify(DEMO_ADMIN));
    }

    // Restore theme
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

    refreshSettings();
    setLoading(false);
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('vortex_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('vortex_user');
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

  const quickSwitchUser = (type: 'admin' | 'client1' | 'client2' | 'client3') => {
    if (type === 'admin') {
      login(DEMO_ADMIN);
    } else {
      login(DEMO_CLIENTS[type]);
    }
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

