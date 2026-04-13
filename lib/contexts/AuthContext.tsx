'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

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
  career?: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isEmailVerified: boolean;
  permissions: {
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
  register: (userData: RegisterData) => Promise<{
    success: boolean;
    error?: string;
    userId?: string;
    email?: string;
  }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasPermission: (permission: keyof User['permissions']) => boolean;
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
  career?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  /** Bumps when login/register succeeds so a stale /api/auth/me cannot clear the new session. */
  const authEpochRef = useRef(0);

  const fetchUser = async () => {
    const startedEpoch = authEpochRef.current;
    try {
      const response = await fetch('/api/auth/me');
      if (startedEpoch !== authEpochRef.current) return;
      if (response.ok) {
        const data = await response.json();
        if (startedEpoch !== authEpochRef.current) return;
        setUser(data.user);
      } else {
        if (startedEpoch !== authEpochRef.current) return;
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      if (startedEpoch !== authEpochRef.current) return;
      setUser(null);
    } finally {
      if (startedEpoch === authEpochRef.current) {
        setLoading(false);
      }
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
        authEpochRef.current += 1;
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
        authEpochRef.current += 1;
        if (data.user) {
          setUser(data.user);
        } else {
          await fetchUser();
        }
        return {
          success: true,
          userId: data.userId,
          email: data.email,
        };
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

  /** Matches forms list access: super admin, org admin, or explicit form-creation permission. */
  const canCreateForms = (): boolean => {
    if (!user) return false;
    if (user.isSuperAdmin) return true;
    if (user.isAdmin) return true;
    return user.permissions?.canCreateForms === true;
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