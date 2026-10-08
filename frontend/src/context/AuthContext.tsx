import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserMode, Language } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (payload: any) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
  loginAsDemo: (mode: UserMode) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('cybersaarthi_token'));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const res = await api.getMe();
          setUser(res.user);
        } catch (err) {
          console.error("Failed to fetch user session", err);
          logout();
        }
      }
      setLoading(false);
    }
    loadUser();
  }, [token]);

  const login = async (identifier: string, password: string) => {
    const res = await api.login({ identifier, password });
    localStorage.setItem('cybersaarthi_token', res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const register = async (payload: any) => {
    const res = await api.register(payload);
    localStorage.setItem('cybersaarthi_token', res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem('cybersaarthi_token');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const loginAsDemo = async (mode: UserMode) => {
    const demoAccounts: Record<UserMode, { email: string; pass: string }> = {
      kid: { email: 'riya@cybersaarthi.org', pass: 'DemoPass123!' },
      adult: { email: 'arun@cybersaarthi.org', pass: 'DemoPass123!' },
      senior: { email: 'lakshmi@cybersaarthi.org', pass: 'DemoPass123!' },
      caretaker: { email: 'caretaker@cybersaarthi.org', pass: 'DemoPass123!' }
    };
    const target = demoAccounts[mode];
    await login(target.email, target.pass);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser, loginAsDemo }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
