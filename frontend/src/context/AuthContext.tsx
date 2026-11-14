import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserMode } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (identifier: string, password: string, remember_me?: boolean) => Promise<{ redirect_url: string; role: string }>;
  register: (payload: any) => Promise<{ redirect_url: string; role: string }>;
  logout: () => void;
  updateUser: (user: User) => void;
  loginAsDemo: (mode: UserMode) => Promise<{ redirect_url: string; role: string }>;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('cybersaarthi_token') || sessionStorage.getItem('cybersaarthi_token')
  );
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadUser() {
      const activeToken = localStorage.getItem('cybersaarthi_token') || sessionStorage.getItem('cybersaarthi_token');
      if (activeToken) {
        try {
          const res = await api.getMe();
          setUser(res.user);
        } catch (err) {
          console.warn("Session expired or invalid, logging out:", err);
          logout();
        }
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  const login = async (identifier: string, password: string, remember_me: boolean = true) => {
    const res = await api.login({ identifier, password, remember_me });
    if (remember_me) {
      localStorage.setItem('cybersaarthi_token', res.token);
      sessionStorage.removeItem('cybersaarthi_token');
    } else {
      sessionStorage.setItem('cybersaarthi_token', res.token);
      localStorage.removeItem('cybersaarthi_token');
    }
    setToken(res.token);
    setUser(res.user);
    return { redirect_url: res.redirect_url, role: res.role };
  };

  const register = async (payload: any) => {
    const res = await api.register(payload);
    localStorage.setItem('cybersaarthi_token', res.token);
    setToken(res.token);
    setUser(res.user);
    return { redirect_url: res.redirect_url, role: res.user.role };
  };

  const logout = () => {
    api.logout().catch(() => {});
    localStorage.removeItem('cybersaarthi_token');
    sessionStorage.removeItem('cybersaarthi_token');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const loginAsDemo = async (mode: UserMode) => {
    const demoAccounts: Record<UserMode, { identifier: string; pass: string }> = {
      kid: { identifier: 'riya_kid', pass: 'DemoPass123!' },
      adult: { identifier: 'arun_adult', pass: 'DemoPass123!' },
      senior: { identifier: 'lakshmi_amma', pass: 'DemoPass123!' },
      caretaker: { identifier: 'suresh_caretaker', pass: 'DemoPass123!' }
    };
    const target = demoAccounts[mode];
    return await login(target.identifier, target.pass, true);
  };

  const hasRole = (targetRole: string): boolean => {
    if (!user) return false;
    const userRole = (user.role || user.user_mode || '').toLowerCase();
    const allRoles = (user.roles || []).map(r => r.toLowerCase());
    return userRole === targetRole.toLowerCase() || allRoles.includes(targetRole.toLowerCase());
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser, loginAsDemo, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
