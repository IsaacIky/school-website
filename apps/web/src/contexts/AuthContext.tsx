'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { api, type UserProfile } from '@/lib/api';
import { getAccessiblePortalKeys, getLandingPathForRole } from '@/config/portals';

interface AuthContextValue {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  /** Computed landing path after login */
  landingPath: string;
  /** All portal keys this user can switch to */
  accessiblePortalKeys: string[];
  /** Refresh user profile from API */
  refresh: () => Promise<void>;
  /** Clear auth state and token */
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const profile = await api.getMe();
      setUser(profile);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const logout = useCallback(() => {
    api.logout();
    setUser(null);
  }, []);

  const landingPath = useMemo(() => {
    if (!user) return '/login';
    if (user.landingPath) return user.landingPath;
    const roles = user.roleAssignments.map((ra) => ra.role.name);
    if (roles.length === 0) return '/login';
    return getLandingPathForRole(roles[0]);
  }, [user]);

  const accessiblePortalKeys = useMemo(() => {
    if (!user) return [];
    if (user.portalOptions) return user.portalOptions;
    const roles = user.roleAssignments.map((ra) => ra.role.name);
    return getAccessiblePortalKeys(roles);
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      landingPath,
      accessiblePortalKeys,
      refresh,
      logout,
    }),
    [user, isLoading, landingPath, accessiblePortalKeys, refresh, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
