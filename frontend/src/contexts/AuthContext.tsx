import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, LoginData, RegisterData } from '../types/auth';
import * as authService from '../services/auth';
import toast from 'react-hot-toast';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  hasActiveAccess: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const handleAuthResponse = (response: { user: User; tokens: { access: string; refresh: string } }) => {
    localStorage.setItem('access_token', response.tokens.access);
    localStorage.setItem('refresh_token', response.tokens.refresh);
    api.defaults.headers.common['Authorization'] = `Bearer ${response.tokens.access}`;
    setUser(response.user);
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        try {
          const userData = await authService.getProfile();
          setUser(userData);
        } catch (error) {
          console.error("Auth initialization failed", error);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          delete api.defaults.headers.common['Authorization'];
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (data: LoginData) => {
    try {
      const response = await authService.login(data);
      handleAuthResponse(response);
      toast.success('Добро пожаловать в SiteKick!');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка входа');
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await authService.register(data);
      handleAuthResponse(response);
      toast.success('Регистрация прошла успешно! Добро пожаловать!');
    } catch (error: any) {
      const errorData = error.response?.data;
      const errorMessage = Object.values(errorData).flat().join(' ') || 'Ошибка регистрации';
      toast.error(errorMessage);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    toast.success('Вы вышли из системы');
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      const updatedUser = await authService.updateProfile(data);
      setUser(updatedUser);
      toast.success('Профиль обновлен');
    } catch (error: any) {
      toast.error('Ошибка обновления профиля');
      throw error;
    }
  };

  const hasActiveAccess = user?.has_active_access || false;

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    hasActiveAccess,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
