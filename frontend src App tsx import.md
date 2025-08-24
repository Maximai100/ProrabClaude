// frontend/src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/layout/Layout';

// Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ProjectsListPage from './pages/projects/ProjectsListPage';
import ProjectDetailPage from './pages/projects/ProjectDetailPage';
import CreateProjectPage from './pages/projects/CreateProjectPage';
import QuoteDetailPage from './pages/quotes/QuoteDetailPage';
import PublicQuotePage from './pages/quotes/PublicQuotePage';
import ProfilePage from './pages/ProfilePage';
import SubscriptionPage from './pages/subscription/SubscriptionPage';

import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Защищенный маршрут
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
};

// Публичный маршрут (только для неавторизованных)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/projects" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* Публичные маршруты */}
              <Route path="/login" element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              } />
              <Route path="/register" element={
                <PublicRoute>
                  <RegisterPage />
                </PublicRoute>
              } />
              
              {/* Публичная страница сметы */}
              <Route path="/quotes/public/:publicId" element={<PublicQuotePage />} />
              
              {/* Защищенные маршруты */}
              <Route path="/projects" element={
                <ProtectedRoute>
                  <ProjectsListPage />
                </ProtectedRoute>
              } />
              <Route path="/projects/new" element={
                <ProtectedRoute>
                  <CreateProjectPage />
                </ProtectedRoute>
              } />
              <Route path="/projects/:id" element={
                <ProtectedRoute>
                  <ProjectDetailPage />
                </ProtectedRoute>
              } />
              <Route path="/quotes/:id" element={
                <ProtectedRoute>
                  <QuoteDetailPage />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } />
              <Route path="/subscription" element={
                <ProtectedRoute>
                  <SubscriptionPage />
                </ProtectedRoute>
              } />
              
              {/* Перенаправления */}
              <Route path="/" element={<Navigate to="/projects" replace />} />
              <Route path="*" element={<Navigate to="/projects" replace />} />
            </Routes>
            
            {/* Toast уведомления */}
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: 4000,
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

---

// frontend/src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, LoginData, RegisterData, AuthTokens } from '../types/auth';
import * as authService from '../services/auth';
import toast from 'react-hot-toast';

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

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const userData = await authService.getProfile();
          setUser(userData);
        } catch (error) {
          // Токен невалиден, удаляем его
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (data: LoginData) => {
    try {
      const response = await authService.login(data);
      
      // Сохраняем токены
      localStorage.setItem('access_token', response.tokens.access);
      localStorage.setItem('refresh_token', response.tokens.refresh);
      
      setUser(response.user);
      toast.success('Добро пожаловать в SiteKick!');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка входа');
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await authService.register(data);
      
      // Сохраняем токены
      localStorage.setItem('access_token', response.tokens.access);
      localStorage.setItem('refresh_token', response.tokens.refresh);
      
      setUser(response.user);
      toast.success('Регистрация прошла успешно! Добро пожаловать!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.email?.[0] || 
                          error.response?.data?.password?.[0] || 
                          'Ошибка регистрации';
      toast.error(errorMessage);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
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

---

// frontend/src/types/auth.ts
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  company_name: string;
  phone: string;
  logo?: string;
  display_name: string;
  has_active_access: boolean;
  is_trial_user: boolean;
  access_expires_at?: string;
  created_at: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  company_name: string;
  phone: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

---

// frontend/src/types/project.ts
export interface Client {
  id: number;
  name: string;
  phone: string;
  email: string;
  created_at: string;
}

export interface Project {
  id: number;
  title: string;
  address: string;
  status: 'active' | 'completed' | 'archived';
  notes: string;
  client?: Client;
  client_id?: number;
  total_quote_amount: string;
  total_expenses: string;
  total_payments_received: string;
  expected_profit: string;
  balance_due: string;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: number;
  amount: string;
  description: string;
  receipt_photo?: string;
  expense_date: string;
  created_at: string;
}

export interface ProjectPayment {
  id: number;
  amount: string;
  description: string;
  payment_date: string;
  created_at: string;
}

export interface ProjectDetail extends Project {
  quotes: Quote[];
  expenses: Expense[];
  payments_received: ProjectPayment[];
}

---

// frontend/src/types/quote.ts
export interface QuoteItem {
  id: number;
  name: string;
  type: 'work' | 'material';
  unit: string;
  quantity: string;
  unit_price: string;
  total_price: string;
  order: number;
  created_at: string;
}

export interface Quote {
  id: number;
  title: string;
  public_id: string;
  notes: string;
  total_amount: string;
  work_amount: string;
  material_amount: string;
  items: QuoteItem[];
  project_title: string;
  client_name?: string;
  created_at: string;
  updated_at: string;
}

export interface CatalogItem {
  id: number;
  name: string;
  type: 'work' | 'material';
  unit: string;
  default_price?: string;
  usage_count: number;
  last_used_at: string;
}

---

// frontend/src/services/api.ts
import axios, { AxiosResponse } from 'axios';
import toast from 'react-hot-toast';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Создаем экземпляр axios
export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor для добавления токена авторизации
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor для обработки ответов
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config;

    // Если получили 401 и это не повторный запрос
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          // Попытка обновить токен
          const response = await axios.post(`${API_URL}/api/auth/token/refresh/`, {
            refresh: refreshToken,
          });

          const newAccessToken = response.data.access;
          localStorage.setItem('access_token', newAccessToken);

          // Повторяем оригинальный запрос с новым токеном
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh token также невалиден, выходим из системы
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
          toast.error('Сессия истекла, необходимо войти снова');
        }
      } else {
        // Нет refresh token, перенаправляем на логин
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;

---

// frontend/src/services/auth.ts
import { AuthResponse, LoginData, RegisterData, User } from '../types/auth';
import api from './api';

export const login = async (data: LoginData): Promise<AuthResponse> => {
  const response = await api.post('/auth/login/', data);
  return response.data;
};

export const register = async (data: RegisterData): Promise<AuthResponse> => {
  const response = await api.post('/auth/register/', data);
  return response.data;
};

export const getProfile = async (): Promise<User> => {
  const response = await api.get('/auth/profile/');
  return response.data;
};

export const updateProfile = async (data: Partial<User>): Promise<User> => {
  const response = await api.put('/auth/profile/', data);
  return response.data;
};

---

// frontend/src/services/projects.ts
import { Project, ProjectDetail, Client, Expense, ProjectPayment } from '../types/project';
import api from './api';

export const getProjects = async (params?: {
  status?: string;
  search?: string;
}): Promise<Project[]> => {
  const response = await api.get('/projects/', { params });
  return response.data.results || response.data;
};

export const getProject = async (id: number): Promise<ProjectDetail> => {
  const response = await api.get(`/projects/${id}/`);
  return response.data;
};

export const createProject = async (data: Partial<Project>): Promise<Project> => {
  const response = await api.post('/projects/', data);
  return response.data;
};

export const updateProject = async (id: number, data: Partial<Project>): Promise<Project> => {
  const response = await api.put(`/projects/${id}/`, data);
  return response.data;
};

export const deleteProject = async (id: number): Promise<void> => {
  await api.delete(`/projects/${id}/`);
};

// Клиенты
export const getClients = async (search?: string): Promise<Client[]> => {
  const response = await api.get('/projects/clients/', { params: { search } });
  return response.data.results || response.data;
};

export const createClient = async (data: Partial<Client>): Promise<Client> => {
  const response = await api.post('/projects/clients/', data);
  return response.data;
};

// Расходы
export const getExpenses = async (projectId: number): Promise<Expense[]> => {
  const response = await api.get(`/projects/${projectId}/expenses/`);
  return response.data.results || response.data;
};

export const createExpense = async (projectId: number, data: FormData): Promise<Expense> => {
  const response = await api.post(`/projects/${projectId}/expenses/`, data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Платежи от клиентов
export const getProjectPayments = async (projectId: number): Promise<ProjectPayment[]> => {
  const response = await api.get(`/projects/${projectId}/payments/`);
  return response.data.results || response.data;
};

export const createProjectPayment = async (projectId: number, data: Partial<ProjectPayment>): Promise<ProjectPayment> => {
  const response = await api.post(`/projects/${projectId}/payments/`, data);
  return response.data;
};

---

// frontend/src/services/quotes.ts
import { Quote, QuoteItem, CatalogItem } from '../types/quote';
import api from './api';

export const getQuotes = async (projectId: number): Promise<Quote[]> => {
  const response = await api.get(`/quotes/projects/${projectId}/quotes/`);
  return response.data.results || response.data;
};

export const getQuote = async (id: number): Promise<Quote> => {
  const response = await api.get(`/quotes/${id}/`);
  return response.data;
};

export const createQuote = async (data: { title: string; notes?: string; project_id: number }): Promise<Quote> => {
  const response = await api.post(`/quotes/projects/${data.project_id}/quotes/`, data);
  return response.data;
};

export const updateQuote = async (id: number, data: Partial<Quote>): Promise<Quote> => {
  const response = await api.put(`/quotes/${id}/`, data);
  return response.data;
};

export const deleteQuote = async (id: number): Promise<void> => {
  await api.delete(`/quotes/${id}/`);
};

// Позиции сметы
export const getQuoteItems = async (quoteId: number): Promise<QuoteItem[]> => {
  const response = await api.get(`/quotes/${quoteId}/items/`);
  return response.data.results || response.data;
};

export const createQuoteItem = async (quoteId: number, data: Partial<QuoteItem>): Promise<QuoteItem> => {
  const response = await api.post(`/quotes/${quoteId}/items/`, data);
  return response.data;
};

export const updateQuoteItem = async (id: number, data: Partial<QuoteItem>): Promise<QuoteItem> => {
  const response = await api.put(`/quotes/items/${id}/`, data);
  return response.data;
};

export const deleteQuoteItem = async (id: number): Promise<void> => {
  await api.delete(`/quotes/items/${id}/`);
};

// Справочник пользователя
export const getCatalogItems = async (params?: {
  search?: string;
  type?: 'work' | 'material';
}): Promise<CatalogItem[]> => {
  const response = await api.get('/quotes/catalog/', { params });
  return response.data.results || response.data;
};

---

// frontend/src/components/layout/Layout.tsx
import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;

---

// frontend/src/components/layout/Header.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, User, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/projects" className="flex items-center">
              <div className="bg-blue-600 text-white p-2 rounded-lg mr-3">
                <span className="font-bold text-lg">SK</span>
              </div>
              <span className="hidden sm:block text-xl font-semibold text-gray-900">
                SiteKick
              </span>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Access status */}
            {user && (
              <div className="text-sm">
                {user.is_trial_user ? (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                    Триальный период
                  </span>
                ) : user.has_active_access ? (
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                    Подписка активна
                  </span>
                ) : (
                  <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                    Подписка истекла
                  </span>
                )}
              </div>
            )}

            {/* Profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100"
              >
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <User size={16} />
                </div>
                <span className="text-sm font-medium">{user?.display_name}</span>
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                  <Link
                    to="/profile"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Settings size={16} className="mr-2" />
                    Профиль
                  </Link>
                  <Link
                    to="/subscription"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <User size={16} className="mr-2" />
                    Подписка
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <LogOut size={16} className="mr-2" />
                    Выйти
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t">
              <Link
                to="/profile"
                onClick={() => setIsMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              >
                Профиль
              </Link>
              <Link
                to="/subscription"
                onClick={() => setIsMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              >
                Подписка
              </Link>
              <button
                onClick={handleLogout}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              >
                Выйти
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;

---

// frontend/src/components/layout/Sidebar.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { FolderOpen, Plus, CreditCard } from 'lucide-react';

const Sidebar: React.FC = () => {
  const navItems = [
    {
      name: 'Все проекты',
      href: '/projects',
      icon: FolderOpen,
      exact: true,
    },
    {
      name: 'Создать проект',
      href: '/projects/new',
      icon: Plus,
    },
    {
      name: 'Подписка',
      href: '/subscription',
      icon: CreditCard,
    },
  ];

  return (
    <aside className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64 bg-white border-r border-gray-200">
        <nav className="flex-1 px-4 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.exact}
              className={({ isActive }) =>
                `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  isActive
                    ? 'bg-blue-100 text-blue-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <item.icon
                className={`mr-3 flex-shrink-0 h-5 w-5`}
                aria-hidden="true"
              />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;

---

// frontend/src/components/ui/Button.tsx
import React from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  children,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500',
    outline: 'border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 focus:ring-blue-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
  };

  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={clsx(
        baseClasses,
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
      )}
      {children}
    </button>
  );
};

export default Button;

---

// frontend/src/App.css
@import 'tailwindcss/base';
@import 'tailwindcss/components';
@import 'tailwindcss/utilities';

/* Кастомные стили для мобильной адаптации */
@media (max-width: 640px) {
  .container {
    padding-left: 1rem;
    padding-right: 1rem;
  }
}

/* Анимации загрузки */
.spinner {
  @apply animate-spin rounded-full border-b-2 border-blue-600;
}

/* Стили для форм */
.form-input {
  @apply block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500;
}

.form-label {
  @apply block text-sm font-medium text-gray-700 mb-1;
}

.form-error {
  @apply mt-1 text-sm text-red-600;
}

/* Стили для карточек */
.card {
  @apply bg-white shadow rounded-lg p-6;
}

.card-header {
  @apply border-b border-gray-200 pb-4 mb-4;
}

/* Утилиты для денежных сумм */
.currency {
  @apply font-mono;
}

.currency-positive {
  @apply text-green-600;
}

.currency-negative {
  @apply text-red-600;
}

/* Статусы */
.status-active {
  @apply bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs;
}

.status-completed {
  @apply bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs;
}

.status-archived {
  @apply bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs;
}
