"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authApi, setTokens, clearTokens } from '../lib/api';

interface User {
  id: string;
  email: string;
  name?: string;
  faithMode?: boolean;
  loveLanguages?: string[];
  anchorTimes?: string[];
  boundaries?: string;
  timeAvailability?: string;
  coupleId?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUserLocal: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const refreshUser = useCallback(async () => {
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }
    
    try {
      const token = localStorage.getItem('one_access_token');
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      const { user: userData } = await authApi.me();
      setUser(userData);
      localStorage.setItem('one_user', JSON.stringify(userData));
    } catch {
      setUser(null);
      clearTokens();
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const { user: userData, accessToken, refreshToken } = await authApi.login(email, password);
    setTokens(accessToken, refreshToken);
    setUser(userData);
    localStorage.setItem('one_user', JSON.stringify(userData));
  };

  const register = async (email: string, password: string, name?: string) => {
    const { user: userData, accessToken, refreshToken } = await authApi.register(email, password, name);
    setTokens(accessToken, refreshToken);
    setUser(userData);
    localStorage.setItem('one_user', JSON.stringify(userData));
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('one_refresh_token');
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch {
      // Ignore logout errors
    } finally {
      clearTokens();
      setUser(null);
    }
  };

  const updateUserLocal = (updates: Partial<User>) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      localStorage.setItem('one_user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
        updateUserLocal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
