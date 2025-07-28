'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  telegram: string;
  phoneNumber: string;
  city: string;
  major?: string;
  intakeYear?: number;
  yearOfStudy?: number;
  highSchool?: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  permissions: {
    canApproveAccounts: boolean;
    canCreateForms: boolean;
    canManageUsers: boolean;
    canViewAnalytics: boolean;
  };
  isApproved: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasPermission: (permission: keyof User['permissions']) => boolean;
  canApproveAccounts: () => boolean;
  canCreateForms: () => boolean;
  canManageUsers: () => boolean;
  canViewAnalytics: () => boolean;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  telegram: string;
  phoneNumber: string;
  city: string;
  major?: string;
  intakeYear?: number;
  yearOfStudy?: number;
  highSchool?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      return { success: false, error: 'Network error occurred' };
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      return { success: false, error: 'Network error occurred' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  // Permission checking functions
  const hasPermission = (permission: keyof User['permissions']): boolean => {
    if (!user) return false;
    if (user.isSuperAdmin) return true;
    return user.isAdmin && user.permissions[permission];
  };

  const canApproveAccounts = (): boolean => {
    return hasPermission('canApproveAccounts');
  };

  const canCreateForms = (): boolean => {
    return hasPermission('canCreateForms');
  };

  const canManageUsers = (): boolean => {
    return hasPermission('canManageUsers');
  };

  const canViewAnalytics = (): boolean => {
    return hasPermission('canViewAnalytics');
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    refreshUser,
    hasPermission,
    canApproveAccounts,
    canCreateForms,
    canManageUsers,
    canViewAnalytics,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 