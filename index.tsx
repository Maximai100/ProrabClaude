/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, createContext, useContext, Fragment } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, NavLink, useParams, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient as useTanstackQueryClient } from '@tanstack/react-query';
import toast, { Toaster } from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import clsx from 'clsx';
import { Eye, EyeOff, Plus, Search, Filter, FolderOpen, ArrowLeft, Edit, FileText, Receipt, Menu, X, User, LogOut, Settings, CreditCard, Trash2 } from 'lucide-react';
import { Transition } from '@headlessui/react';

// --- TYPES ---

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  company_name: string;
  phone: string;
  display_name: string;
  has_active_access: boolean;
  is_trial_user: boolean;
  access_expires_at?: string;
}
interface LoginData { email: string; password: string; }
interface RegisterData { email: string; password: string; password_confirm: string; first_name: string; last_name: string; company_name: string; phone: string; }
interface AuthTokens { access: string; refresh: string; }
interface AuthResponse { user: User; tokens: AuthTokens; }

interface Client { id: number; userId: number; name: string; phone: string; email: string; created_at: string; }
interface Project { id: number; title: string; address: string; status: 'active' | 'completed' | 'archived'; notes: string; client?: Client; client_id?: number; total_quote_amount: string; total_expenses: string; total_payments_received: string; expected_profit: string; balance_due: string; created_at: string; updated_at: string; }
interface Expense { id: number; amount: string; description: string; receipt_photo?: string; expense_date: string; created_at: string; }
interface ProjectPayment { id: number; amount: string; description: string; payment_date: string; created_at: string; }
interface QuoteItem { id: number; name: string; type: 'work' | 'material'; unit: string; quantity: string; unit_price: string; total_price: string; order: number; created_at: string; }
interface Quote { id: number; project_id: number; title: string; public_id: string; notes: string; total_amount: string; work_amount: string; material_amount: string; items: QuoteItem[]; project_title: string; client_name?: string; created_at: string; updated_at: string; }
interface ProjectDetail extends Project { quotes: Quote[]; expenses: Expense[]; payments_received: ProjectPayment[]; }

// --- MOCK API & DATABASE ---
const mockDb = {
    users: [
        { id: 1, email: 'demo@sitekick.app', password: 'demo123456', first_name: 'Демо', last_name: 'Пользователь', company_name: 'Демо Бригада', phone: '+7 (999) 123-45-67', has_active_access: true, is_trial_user: true, access_expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() },
    ],
    clients: [
        { id: 1, userId: 1, name: 'Иван Петров', phone: '+7 (999) 111-11-11', email: 'petrov@example.com', created_at: new Date().toISOString() },
        { id: 2, userId: 1, name: 'Мария Сидорова', phone: '+7 (999) 222-22-22', email: 'sidorova@example.com', created_at: new Date().toISOString() },
        { id: 3, userId: 1, name: 'ООО "Рога и Копыта"', phone: '+7 (999) 333-33-33', email: 'info@rogakopyta.ru', created_at: new Date().toISOString() },
    ],
    projects: [
        { id: 1, userId: 1, client_id: 1, title: 'Ремонт квартиры на ул. Ленина, 15', address: 'г. Москва, ул. Ленина, д. 15, кв. 42', status: 'active', notes: 'Двухкомнатная квартира, требуется полный ремонт', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 2, userId: 1, client_id: 3, title: 'Электромонтажные работы в офисе', address: 'г. Москва, ул. Тверская, д. 5, офис 301', status: 'active', notes: 'Замена электропроводки', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 3, userId: 1, client_id: 2, title: 'Отделка дома в Подмосковье', address: 'Московская обл., Одинцовский р-н, п. Лесной', status: 'completed', notes: 'Внутренняя отделка', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    ],
    quotes: [
        { id: 1, project_id: 1, title: "Смета по квартире", public_id: 'abc123def', notes: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 2, project_id: 2, title: "Электрика в офисе", public_id: 'ghj456klm', notes: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 3, project_id: 3, title: "Отделочные работы", public_id: 'xyz789qwe', notes: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    ],
    quoteItems: [
        { id: 1, quote_id: 1, name: 'Штукатурка стен', type: 'work', unit: 'м²', quantity: '25.00', unit_price: '600.00', order: 1, created_at: new Date().toISOString() },
        { id: 2, quote_id: 1, name: 'Поклейка обоев', type: 'work', unit: 'м²', quantity: '20.00', unit_price: '400.00', order: 2, created_at: new Date().toISOString() },
        { id: 3, quote_id: 1, name: 'Ламинат 33 класс', type: 'material', unit: 'м²', quantity: '38.00', unit_price: '1250.00', order: 3, created_at: new Date().toISOString() },
    ],
    expenses: [
        { id: 1, project_id: 1, amount: '5000', description: 'Закупка материалов в Леруа', expense_date: new Date().toISOString(), created_at: new Date().toISOString() },
    ],
    payments: [
        { id: 1, project_id: 1, amount: '50000', description: 'Предоплата 50%', payment_date: new Date().toISOString(), created_at: new Date().toISOString() },
    ]
};

const mockApi = {
  login: (data: LoginData): Promise<AuthResponse> => new Promise((resolve, reject) => {
    setTimeout(() => {
        const user = mockDb.users.find(u => u.email === data.email && u.password === data.password);
        if (user) {
            const { password, ...userWithoutPassword } = user;
            const fullUser = { ...userWithoutPassword, display_name: `${user.first_name} ${user.last_name}`};
            resolve({ user: fullUser, tokens: { access: 'mock_access_token', refresh: 'mock_refresh_token' } });
        } else {
            reject({ response: { data: { detail: 'Неверные учетные данные' } } });
        }
    }, 500);
  }),
  register: (data: RegisterData): Promise<AuthResponse> => new Promise((resolve, reject) => {
    setTimeout(() => {
        if (mockDb.users.some(u => u.email === data.email)) {
             reject({ response: { data: { email: ['Пользователь с таким email уже существует.'] } } });
             return;
        }
        const newUser = {
            id: mockDb.users.length + 1,
            email: data.email,
            password: data.password,
            first_name: data.first_name,
            last_name: data.last_name,
            company_name: data.company_name,
            phone: data.phone,
            has_active_access: true,
            is_trial_user: true,
            access_expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
        };
        mockDb.users.push(newUser);
        const { password, ...userWithoutPassword } = newUser;
        const fullUser = { ...userWithoutPassword, display_name: `${newUser.first_name} ${newUser.last_name}`};
        resolve({ user: fullUser, tokens: { access: 'mock_access_token', refresh: 'mock_refresh_token' } });
    }, 500);
  }),
  getProfile: (userId: number): Promise<User> => new Promise((resolve, reject) => {
      setTimeout(() => {
          const user = mockDb.users.find(u => u.id === userId);
          if (user) {
              const { password, ...userWithoutPassword } = user;
              resolve({ ...userWithoutPassword, display_name: `${user.first_name} ${user.last_name}`});
          } else {
              reject(new Error("User not found"));
          }
      }, 200);
  }),
  updateProfile: (userId: number, data: Partial<User>): Promise<User> => new Promise((resolve, reject) => {
      setTimeout(() => {
          const userIndex = mockDb.users.findIndex(u => u.id === userId);
          if (userIndex !== -1) {
              mockDb.users[userIndex] = { ...mockDb.users[userIndex], ...data };
              const user = mockDb.users[userIndex];
              const { password, ...userWithoutPassword } = user;
              resolve({ ...userWithoutPassword, display_name: `${user.first_name} ${user.last_name}`});
          } else {
              reject(new Error("User not found"));
          }
      }, 500);
  }),
  getProjects: (userId: number, params: { status?: string, search?: string }): Promise<Project[]> => new Promise(resolve => {
    setTimeout(() => {
        let projects = mockDb.projects.filter(p => p.userId === userId);
        if (params.status) {
            projects = projects.filter(p => p.status === params.status);
        }
        if (params.search) {
            projects = projects.filter(p => p.title.toLowerCase().includes(params.search.toLowerCase()) || p.address.toLowerCase().includes(params.search.toLowerCase()));
        }
        const projectsWithData = projects.map(p => ({...p, client: mockDb.clients.find(c => c.id === p.client_id)}));
        resolve(projectsWithData.map(calculateProjectTotals));
    }, 300);
  }),
  getProject: (userId: number, id: number): Promise<ProjectDetail> => new Promise((resolve, reject) => {
      setTimeout(() => {
          const project = mockDb.projects.find(p => p.id === id && p.userId === userId);
          if (!project) return reject(new Error("Project not found"));
          
          const client = mockDb.clients.find(c => c.id === project.client_id);
          const quotes = mockDb.quotes.filter(q => q.project_id === id).map(calculateQuoteTotals);
          const expenses = mockDb.expenses.filter(e => e.project_id === id);
          const payments = mockDb.payments.filter(p => p.project_id === id);
          
          const projectDetail = { ...project, client, quotes, expenses, payments_received: payments };
          resolve(calculateProjectTotals(projectDetail) as ProjectDetail);
      }, 300);
  }),
  createProject: (userId: number, data: Partial<Project>): Promise<Project> => new Promise((resolve) => {
    setTimeout(() => {
        const newProject: any = {
            id: mockDb.projects.length + 1,
            userId,
            title: data.title,
            address: data.address,
            client_id: data.client_id,
            status: 'active',
            notes: data.notes,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        mockDb.projects.push(newProject);
        resolve(calculateProjectTotals(newProject));
    }, 500);
  }),
  getClients: (userId: number): Promise<Client[]> => new Promise(resolve => {
      setTimeout(() => {
          resolve(mockDb.clients.filter(c => c.userId === userId));
      }, 200);
  }),
  createClient: (userId: number, data: Partial<Client>): Promise<Client> => new Promise(resolve => {
      setTimeout(() => {
          const newClient: Client = {
              id: mockDb.clients.length + 1,
              userId,
              name: data.name!,
              phone: data.phone || '',
              email: data.email || '',
              created_at: new Date().toISOString(),
          };
          mockDb.clients.push(newClient);
          resolve(newClient);
      }, 500);
  }),
  getQuote: (userId: number, id: number): Promise<Quote> => new Promise((resolve, reject) => {
      setTimeout(() => {
          const quote = mockDb.quotes.find(q => q.id === id);
          if (!quote) return reject(new Error("Quote not found"));
          const project = mockDb.projects.find(p => p.id === quote.project_id);
          if (project?.userId !== userId) return reject(new Error("Unauthorized"));
          
          const client = mockDb.clients.find(c => c.id === project.client_id);
          
          const quoteWithData = {
              ...quote,
              project_title: project.title,
              client_name: client?.name,
          };
          resolve(calculateQuoteTotals(quoteWithData));
      }, 300);
  })
};

const calculateQuoteTotals = (quote: any): Quote => {
    const items = mockDb.quoteItems.filter(i => i.quote_id === quote.id).map(item => ({...item, total_price: (parseFloat(item.quantity) * parseFloat(item.unit_price)).toFixed(2) }));
    const work_amount = items.filter(i => i.type === 'work').reduce((sum, i) => sum + parseFloat(i.total_price), 0);
    const material_amount = items.filter(i => i.type === 'material').reduce((sum, i) => sum + parseFloat(i.total_price), 0);
    const total_amount = work_amount + material_amount;
    return { ...quote, items, work_amount: work_amount.toFixed(2), material_amount: material_amount.toFixed(2), total_amount: total_amount.toFixed(2) };
};

const calculateProjectTotals = (project: any): Project => {
    const quotes = mockDb.quotes.filter(q => q.project_id === project.id).map(calculateQuoteTotals);
    const total_quote_amount = quotes.reduce((sum, q) => sum + parseFloat(q.total_amount), 0);
    const total_expenses = mockDb.expenses.filter(e => e.project_id === project.id).reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const total_payments_received = mockDb.payments.filter(p => p.project_id === project.id).reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const expected_profit = total_quote_amount - total_expenses;
    const balance_due = total_quote_amount - total_payments_received;

    return { ...project, total_quote_amount: total_quote_amount.toFixed(2), total_expenses: total_expenses.toFixed(2), total_payments_received: total_payments_received.toFixed(2), expected_profit: expected_profit.toFixed(2), balance_due: balance_due.toFixed(2) };
};

// --- SERVICES ---
const authService = {
  login: (data: LoginData) => mockApi.login(data),
  register: (data: RegisterData) => mockApi.register(data),
  getProfile: () => {
    const userId = JSON.parse(localStorage.getItem('user_id') || 'null');
    if (!userId) return Promise.reject("Not logged in");
    return mockApi.getProfile(userId);
  },
  updateProfile: (data: Partial<User>) => {
    const userId = JSON.parse(localStorage.getItem('user_id') || 'null');
    if (!userId) return Promise.reject("Not logged in");
    return mockApi.updateProfile(userId, data);
  }
};

const projectsService = {
  getProjects: (params: { status?: string, search?: string }) => {
    const userId = JSON.parse(localStorage.getItem('user_id') || 'null');
    return mockApi.getProjects(userId, params);
  },
  getProject: (id: number) => {
    const userId = JSON.parse(localStorage.getItem('user_id') || 'null');
    return mockApi.getProject(userId, id);
  },
   createProject: (data: Partial<Project>) => {
    const userId = JSON.parse(localStorage.getItem('user_id') || 'null');
    return mockApi.createProject(userId, data);
  },
  getClients: () => {
    const userId = JSON.parse(localStorage.getItem('user_id') || 'null');
    return mockApi.getClients(userId);
  },
  createClient: (data: Partial<Client>) => {
    const userId = JSON.parse(localStorage.getItem('user_id') || 'null');
    return mockApi.createClient(userId, data);
  }
};

const quotesService = {
  getQuote: (id: number) => {
    const userId = JSON.parse(localStorage.getItem('user_id') || 'null');
    return mockApi.getQuote(userId, id);
  },
};

// --- UI COMPONENTS ---
const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'danger'; size?: 'sm' | 'md' | 'lg'; loading?: boolean; }> = ({ variant = 'primary', size = 'md', loading = false, disabled, className, children, ...props }) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150';
  const variants = { primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500', secondary: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500', outline: 'border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 focus:ring-blue-500', danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500' };
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-6 py-3 text-base' };
  return (
    <button className={clsx(baseClasses, variants[variant], sizes[size], className)} disabled={disabled || loading} {...props}>
      {loading && <svg className="animate-spin -ml-1 mr-3 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
      {children}
    </button>
  );
};

const Header: React.FC = () => {
    const { user, logout } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const getAccessBadge = () => {
        if (!user) return null;
        if (user.is_trial_user) return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">Триальный период</span>;
        if (user.has_active_access) return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Подписка активна</span>;
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Подписка истекла</span>;
    };
    return (
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-20">
            <div className="px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <Link to="/projects" className="flex items-center"><div className="bg-blue-600 text-white p-2 rounded-lg mr-3"><span className="font-bold text-lg">SK</span></div><span className="hidden sm:block text-xl font-semibold text-gray-900">SiteKick</span></Link>
                    <div className="flex items-center space-x-4">
                        <div className="hidden md:flex items-center space-x-4">
                            {getAccessBadge()}
                            <div className="relative">
                                <button onClick={() => setIsProfileOpen(!isProfileOpen)} onBlur={() => setTimeout(() => setIsProfileOpen(false), 200)} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100"><div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-500"><User size={16} /></div><span className="text-sm font-medium">{user?.display_name}</span></button>
                                <Transition as={Fragment} show={isProfileOpen} enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100" leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95">
                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200"><div className="px-4 py-3 border-b"><p className="text-sm font-medium text-gray-900 truncate">{user?.display_name}</p><p className="text-xs text-gray-500 truncate">{user?.email}</p></div><NavLink to="/profile" onClick={() => setIsProfileOpen(false)} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><Settings size={16} className="mr-3" />Профиль</NavLink><NavLink to="/subscription" onClick={() => setIsProfileOpen(false)} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><CreditCard size={16} className="mr-3" />Подписка</NavLink><button onClick={logout} className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"><LogOut size={16} className="mr-3" />Выйти</button></div>
                                </Transition>
                            </div>
                        </div>
                        <div className="md:hidden"><button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100">{isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}</button></div>
                    </div>
                </div>
                {isMobileMenuOpen && <div className="md:hidden border-t"><div className="px-2 pt-2 pb-3 space-y-1 sm:px-3"><NavLink to="/projects" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"><FolderOpen size={18} className="mr-3" />Проекты</NavLink><NavLink to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"><Settings size={18} className="mr-3" />Профиль</NavLink><NavLink to="/subscription" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"><CreditCard size={18} className="mr-3" />Подписка</NavLink><div className='pt-2 mt-2 border-t'><button onClick={logout} className="flex items-center w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50"><LogOut size={18} className="mr-3" />Выйти</button></div></div></div>}
            </div>
        </header>
    );
};

const Sidebar: React.FC = () => {
    const navItems = [
        { name: 'Все проекты', href: '/projects', icon: FolderOpen, exact: true },
        { name: 'Создать проект', href: '/projects/new', icon: Plus },
        { name: 'Подписка', href: '/subscription', icon: CreditCard },
    ];
    return (
        <aside className="hidden md:flex md:flex-shrink-0">
            <div className="flex flex-col w-64 bg-white border-r border-gray-200">
                <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
                    <nav className="mt-5 flex-1 px-2 space-y-1">
                        {navItems.map(item => <NavLink key={item.name} to={item.href} end={item.exact} className={({ isActive }) => clsx('group flex items-center px-2 py-2 text-sm font-medium rounded-md', isActive ? 'bg-blue-100 text-blue-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900')}><item.icon className="mr-3 flex-shrink-0 h-5 w-5 text-gray-400 group-hover:text-gray-500" aria-hidden="true" />{item.name}</NavLink>)}
                    </nav>
                </div>
            </div>
        </aside>
    );
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="min-h-screen bg-gray-50"><Header /><div className="flex"><Sidebar /><main className="flex-1 p-4 sm:p-6 lg:p-8"><div className="max-w-7xl mx-auto">{children}</div></main></div></div>
);

// --- CONTEXT ---
const AuthContext = createContext<any>(undefined);
const useAuth = () => useContext(AuthContext);

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const handleAuthResponse = (response: AuthResponse) => {
        localStorage.setItem('user_id', JSON.stringify(response.user.id));
        setUser(response.user);
    };

    useEffect(() => {
        const initializeAuth = async () => {
            const userId = JSON.parse(localStorage.getItem('user_id') || 'null');
            if (userId) {
                try {
                    const userData = await authService.getProfile();
                    setUser(userData);
                } catch (error) {
                    console.error("Auth init failed", error);
                    localStorage.removeItem('user_id');
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
            toast.success('Регистрация прошла успешно!');
        } catch (error: any) {
            const errorMessage = error.response?.data?.email?.[0] || 'Ошибка регистрации';
            toast.error(errorMessage);
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('user_id');
        setUser(null);
        toast.success('Вы вышли из системы');
    };
    
    const updateProfile = async (data: Partial<User>) => {
        try {
            const updatedUser = await authService.updateProfile(data);
            setUser(updatedUser);
        } catch (error) {
            toast.error('Ошибка обновления профиля');
            throw error;
        }
    };

    const value = { user, loading, login, register, logout, updateProfile, hasActiveAccess: user?.has_active_access || false };
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// --- PAGES ---
const LoginPage: React.FC = () => {
    const { login } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const { register, handleSubmit, formState: { errors } } = useForm<LoginData>();
    const [isLoading, setIsLoading] = useState(false);
    const onSubmit = async (data: LoginData) => {
        setIsLoading(true);
        try { await login(data); } catch (error) {} 
        finally { setIsLoading(false); }
    };
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md"><div className="flex justify-center"><div className="bg-blue-600 text-white p-3 rounded-xl"><span className="font-bold text-2xl">SK</span></div></div><h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Вход в SiteKick</h2><p className="mt-2 text-center text-sm text-gray-600">Или <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">зарегистрируйтесь бесплатно</Link></p></div>
            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"><div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10"><form onSubmit={handleSubmit(onSubmit)} className="space-y-6"><div><label htmlFor="email" className="form-label">Email адрес</label><input id="email" type="email" autoComplete="email" className="form-input" {...register('email', { required: 'Email обязателен', pattern: { value: /^\S+@\S+$/i, message: 'Неверный формат email' } })} />{errors.email && <p className="form-error">{errors.email.message}</p>}</div><div><label htmlFor="password" className="form-label">Пароль</label><div className="relative"><input id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" className="form-input pr-10" {...register('password', { required: 'Пароль обязателен' })} /><button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={16} className="text-gray-400" /> : <Eye size={16} className="text-gray-400" />}</button></div>{errors.password && <p className="form-error">{errors.password.message}</p>}</div><div><Button type="submit" loading={isLoading} className="w-full">Войти</Button></div></form><div className="mt-6"><div className="relative"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300" /></div><div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">Для демо</span></div></div><div className="mt-6"><div className="bg-gray-50 rounded-md p-4 text-sm"><p className="font-medium text-gray-900 mb-2">Тестовый доступ:</p><p className="text-gray-600">Email: <code className="bg-white px-1 py-0.5 rounded">demo@sitekick.app</code></p><p className="text-gray-600">Пароль: <code className="bg-white px-1 py-0.5 rounded">demo123456</code></p></div></div></div></div></div>
        </div>
    );
};

const RegisterPage: React.FC = () => {
    const { register: registerUser } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterData>();
    const [isLoading, setIsLoading] = useState(false);
    const password = watch('password');
    const onSubmit = async (data: RegisterData) => {
        setIsLoading(true);
        try { await registerUser(data); } catch (error) {}
        finally { setIsLoading(false); }
    };
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md"><div className="flex justify-center"><div className="bg-blue-600 text-white p-3 rounded-xl"><span className="font-bold text-2xl">SK</span></div></div><h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Регистрация в SiteKick</h2><p className="mt-2 text-center text-sm text-gray-600">Уже есть аккаунт? <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">Войти</Link></p></div>
            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"><div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10"><form onSubmit={handleSubmit(onSubmit)} className="space-y-4"><div><label htmlFor="email" className="form-label">Email</label><input id="email" type="email" className="form-input" {...register('email', { required: 'Email обязателен' })} />{errors.email && <p className="form-error">{errors.email.message}</p>}</div><div className="grid grid-cols-2 gap-4"><div><label htmlFor="first_name" className="form-label">Имя</label><input id="first_name" type="text" className="form-input" {...register('first_name', { required: 'Имя обязательно' })} />{errors.first_name && <p className="form-error">{errors.first_name.message}</p>}</div><div><label htmlFor="last_name" className="form-label">Фамилия</label><input id="last_name" type="text" className="form-input" {...register('last_name', { required: 'Фамилия обязательна' })} />{errors.last_name && <p className="form-error">{errors.last_name.message}</p>}</div></div><div><label htmlFor="company_name" className="form-label">Название компании</label><input id="company_name" type="text" className="form-input" {...register('company_name', { required: 'Название обязательно' })} />{errors.company_name && <p className="form-error">{errors.company_name.message}</p>}</div><div><label htmlFor="phone" className="form-label">Телефон</label><input id="phone" type="tel" className="form-input" {...register('phone', { required: 'Телефон обязателен' })} />{errors.phone && <p className="form-error">{errors.phone.message}</p>}</div><div><label htmlFor="password" className="form-label">Пароль</label><div className="relative"><input id="password" type={showPassword ? 'text' : 'password'} className="form-input" {...register('password', { required: 'Пароль обязателен', minLength: { value: 8, message: 'Пароль должен быть не менее 8 символов' } })} /><button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}</button></div>{errors.password && <p className="form-error">{errors.password.message}</p>}</div><div><label htmlFor="password_confirm" className="form-label">Подтвердите пароль</label><input id="password_confirm" type="password" className="form-input" {...register('password_confirm', { validate: value => value === password || "Пароли не совпадают" })} />{errors.password_confirm && <p className="form-error">{errors.password_confirm.message}</p>}</div><div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-center"><p className="text-sm text-blue-800"><strong>3 дня бесплатно!</strong> Попробуйте все возможности.</p></div><div><Button type="submit" loading={isLoading} className="w-full">Создать аккаунт</Button></div></form></div></div>
        </div>
    );
};

const ProjectsListPage: React.FC = () => {
    const { hasActiveAccess } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const { data: projects = [], isLoading, error } = useQuery<Project[], Error>({ queryKey: ['projects', { search: searchTerm, status: statusFilter }], queryFn: () => projectsService.getProjects({ search: searchTerm, status: statusFilter }) });
    const formatCurrency = (value: string) => new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0 }).format(parseFloat(value));
    const getStatusBadge = (status: string) => {
        const map: any = { active: 'status-active', completed: 'status-completed', archived: 'status-archived' };
        const labelMap: any = { active: 'В работе', completed: 'Завершен', archived: 'Архивный' };
        return <span className={map[status]}>{labelMap[status]}</span>;
    };

    if (isLoading) return <div className="flex items-center justify-center h-64"><div className="spinner h-8 w-8"></div></div>;
    if (error) return <div className="text-center py-12"><p className="text-red-600">Ошибка загрузки проектов</p></div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-2xl font-bold text-gray-900">Проекты</h1><p className="mt-1 text-sm text-gray-500">Управляйте своими строительными проектами</p></div><div className="mt-4 sm:mt-0"><Link to="/projects/new"><Button disabled={!hasActiveAccess}><Plus size={16} className="mr-2" />Новый проект</Button></Link></div></div>
            {!hasActiveAccess && <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4"><div className="flex"><div className="ml-3"><p className="text-sm text-yellow-700">Ваш доступ ограничен. <Link to="/subscription" className="font-medium underline hover:text-yellow-800 ml-1">Оформите подписку</Link> чтобы продолжить.</p></div></div></div>}
            <div className="flex flex-col sm:flex-row gap-4"><div className="relative flex-1"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Поиск по названию или адресу..." className="pl-10 form-input" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div><div className="relative"><select className="form-input pr-10 appearance-none" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option value="">Все статусы</option><option value="active">В работе</option><option value="completed">Завершен</option><option value="archived">Архивный</option></select><Filter size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" /></div></div>
            {projects.length === 0 ? <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg"><FolderOpen size={48} className="mx-auto text-gray-400 mb-4" /><h3 className="text-lg font-medium text-gray-900 mb-2">Пока нет проектов</h3><p className="text-gray-500 mb-6">Создайте свой первый проект, чтобы начать работу</p><Link to="/projects/new"><Button disabled={!hasActiveAccess}><Plus size={16} className="mr-2" />Создать первый проект</Button></Link></div>
                : <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{projects.map((project: Project) => <Link key={project.id} to={`/projects/${project.id}`} className="card hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer flex flex-col justify-between"><div><div className="flex items-start justify-between mb-4"><div className="flex-1 min-w-0"><h3 className="text-lg font-medium text-gray-900 truncate">{project.title}</h3>{project.address && <p className="text-sm text-gray-500 mt-1 truncate">{project.address}</p>}</div>{getStatusBadge(project.status)}</div>{project.client && <div className="mb-4"><p className="text-sm text-gray-600"><span className="font-medium">Клиент:</span> {project.client.name}</p></div>}<div className="grid grid-cols-2 gap-4 text-sm"><div><p className="text-gray-500">Смета</p><p className="font-semibold currency text-gray-800">{formatCurrency(project.total_quote_amount)}</p></div><div><p className="text-gray-500">Прибыль</p><p className={clsx('font-semibold currency', parseFloat(project.expected_profit) >= 0 ? 'currency-positive' : 'currency-negative')}>{formatCurrency(project.expected_profit)}</p></div></div></div><div className="mt-4 pt-4 border-t border-gray-200"><p className="text-xs text-gray-500">Создан {new Date(project.created_at).toLocaleDateString('ru-RU')}</p></div></Link>)}</div>}
        </div>
    );
};

interface CreateProjectFormData {
  title: string;
  address: string;
  client_id?: number;
  new_client_name?: string;
  new_client_phone?: string;
  new_client_email?: string;
  notes: string;
}

const CreateProjectPage: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useTanstackQueryClient();
    
    const { data: clients = [] } = useQuery<Client[], Error>({ 
        queryKey: ['clients'], 
        queryFn: projectsService.getClients 
    });

    const { register, handleSubmit, watch, formState: { errors } } = useForm<CreateProjectFormData>();
    
    const createProjectMutation = useMutation<Project, Error, Partial<Project>>({ 
        mutationFn: projectsService.createProject, 
        onSuccess: (data) => { 
            toast.success('Проект создан!'); 
            queryClient.invalidateQueries({ queryKey: ['projects'] }); 
            navigate(`/projects/${data.id}`); 
        }, 
        onError: () => toast.error('Ошибка создания проекта') 
    });

    const createClientMutation = useMutation<Client, Error, Partial<Client>>({ 
        mutationFn: projectsService.createClient, 
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
        } 
    });
    
    const clientId = watch('client_id');
    const isNewClient = clientId === -1;

    const onSubmit = async (data: CreateProjectFormData) => {
        let finalClientId: number | undefined = data.client_id;
        
        if (isNewClient && data.new_client_name) {
            try {
                const newClient = await createClientMutation.mutateAsync({ 
                    name: data.new_client_name, 
                    phone: data.new_client_phone, 
                    email: data.new_client_email 
                });
                finalClientId = newClient.id;
            } catch (error) {
                toast.error('Ошибка создания клиента');
                return;
            }
        }
        
        await createProjectMutation.mutateAsync({ 
            title: data.title, 
            address: data.address, 
            client_id: finalClientId, 
            notes: data.notes 
        });
    };

    return (
        <div className="max-w-3xl mx-auto"><div className="mb-8"><button onClick={() => navigate('/projects')} className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"><ArrowLeft size={16} className="mr-2" />Назад к проектам</button><h1 className="text-2xl font-bold text-gray-900">Новый проект</h1><p className="mt-1 text-sm text-gray-500">Заполните информацию, чтобы создать новый объект</p></div><div className="card"><form onSubmit={handleSubmit(onSubmit)} className="space-y-6"><div><label htmlFor="title" className="form-label">Название проекта *</label><input id="title" type="text" className="form-input" placeholder="Ремонт квартиры на ул. Ленина, 10" {...register('title', { required: 'Название проекта обязательно' })} />{errors.title && <p className="form-error">{errors.title.message}</p>}</div><div><label htmlFor="address" className="form-label">Адрес объекта</label><textarea id="address" rows={2} className="form-input" placeholder="г. Москва, ул. Ленина, д. 10, кв. 25" {...register('address')} /></div><div><label htmlFor="client_id" className="form-label">Клиент</label><select id="client_id" className="form-input" {...register('client_id', { valueAsNumber: true})}><option value="">Без клиента</option><option value={-1}>+ Создать нового клиента</option>{clients.map((c: Client) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>{isNewClient && <div className="bg-gray-50 p-4 rounded-lg space-y-4 border"><h4 className="font-medium">Данные нового клиента</h4><div><label htmlFor="new_client_name" className="form-label">Имя *</label><input id="new_client_name" type="text" className="form-input" {...register('new_client_name', { required: isNewClient })} />{errors.new_client_name && <p className="form-error">Имя обязательно</p>}</div><div className="grid sm:grid-cols-2 gap-4"><div><label htmlFor="new_client_phone" className="form-label">Телефон</label><input id="new_client_phone" type="tel" className="form-input" {...register('new_client_phone')} /></div><div><label htmlFor="new_client_email" className="form-label">Email</label><input id="new_client_email" type="email" className="form-input" {...register('new_client_email')} /></div></div></div>}<div><label htmlFor="notes" className="form-label">Заметки</label><textarea id="notes" rows={4} className="form-input" {...register('notes')} /></div><div className="flex justify-end space-x-3 pt-4 border-t"><Button type="button" variant="outline" onClick={() => navigate('/projects')}>Отмена</Button><Button type="submit" loading={createProjectMutation.isPending || createClientMutation.isPending}>Создать проект</Button></div></form></div></div>
    );
};

const ProjectDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { data: project, isLoading, error } = useQuery<ProjectDetail, Error>({ queryKey: ['project', Number(id)], queryFn: () => projectsService.getProject(Number(id)), enabled: !!id });
    const formatCurrency = (value: string | number) => new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0 }).format(Number(value));

    if (isLoading) return <div className="spinner h-8 w-8 mx-auto mt-10"></div>;
    if (error || !project) return <div className="text-center text-red-600">Не удалось загрузить проект.</div>;
    
    return (
        <div className="space-y-6"><div><Link to="/projects" className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"><ArrowLeft size={16} className="mr-2" />Назад к проектам</Link><div className="flex flex-col sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-2xl font-bold text-gray-900">{project.title}</h1><p className="mt-1 text-sm text-gray-500">{project.address}</p></div><div className="mt-4 sm:mt-0"><Button variant="outline"><Edit size={16} className="mr-2" />Редактировать</Button></div></div></div><div className="grid grid-cols-2 md:grid-cols-4 gap-4"><div className="card text-center"><p className="text-sm text-gray-500">Сумма смет</p><p className="text-xl font-bold currency">{formatCurrency(project.total_quote_amount)}</p></div><div className="card text-center"><p className="text-sm text-gray-500">Расходы</p><p className="text-xl font-bold currency">{formatCurrency(project.total_expenses)}</p></div><div className="card text-center"><p className="text-sm text-gray-500">Оплачено</p><p className="text-xl font-bold currency">{formatCurrency(project.total_payments_received)}</p></div><div className="card text-center"><p className="text-sm text-gray-500">Прибыль</p><p className={clsx('text-xl font-bold currency', Number(project.expected_profit) >= 0 ? 'currency-positive' : 'currency-negative')}>{formatCurrency(project.expected_profit)}</p></div></div><div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><div className="card space-y-4"><div className="flex justify-between items-center"><h2 className="text-lg font-semibold flex items-center"><FileText size={20} className="mr-2" />Сметы</h2><Button size="sm"><Plus size={14} className="mr-1" />Создать смету</Button></div>{project.quotes.length > 0 ? <ul className="divide-y">{project.quotes.map(quote => <li key={quote.id} className="py-2 flex justify-between items-center"><Link to={`/quotes/${quote.id}`} className="text-blue-600 hover:underline">{quote.title}</Link><span className="font-medium currency">{formatCurrency(quote.total_amount)}</span></li>)}</ul> : <p className="text-sm text-gray-500 text-center py-4">Смет пока нет</p>}</div><div className="card space-y-4"><div className="flex justify-between items-center"><h2 className="text-lg font-semibold flex items-center"><Receipt size={20} className="mr-2" />Расходы</h2><Button size="sm"><Plus size={14} className="mr-1" />Добавить расход</Button></div>{project.expenses.length > 0 ? <ul className="divide-y">{project.expenses.map(expense => <li key={expense.id} className="py-2 flex justify-between items-center"><span>{expense.description || "Расход"} <span className="text-xs text-gray-400">({new Date(expense.expense_date).toLocaleDateString()})</span></span><span className="font-medium currency">{formatCurrency(expense.amount)}</span></li>)}</ul> : <p className="text-sm text-gray-500 text-center py-4">Расходов пока нет</p>}</div></div></div>
    );
};

const QuoteDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { data: quote, isLoading, error } = useQuery<Quote, Error>({ queryKey: ['quote', Number(id)], queryFn: () => quotesService.getQuote(Number(id)), enabled: !!id });
    const formatCurrency = (value: string | number) => new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(Number(value));

    if (isLoading) return <div className="spinner h-8 w-8 mx-auto mt-10"></div>;
    if (error || !quote) return <div className="text-center text-red-600">Не удалось загрузить смету.</div>;
    
    const workItems = quote.items.filter(item => item.type === 'work');
    const materialItems = quote.items.filter(item => item.type === 'material');

    return (
        <div className="space-y-6"><div><Link to={`/projects/${quote.project_id}`} className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"><ArrowLeft size={16} className="mr-2" />Назад к проекту</Link><div className="flex flex-col sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-2xl font-bold text-gray-900">{quote.title}</h1><p className="mt-1 text-sm text-gray-500">Проект: {quote.project_title}</p></div><div className="mt-4 sm:mt-0 flex space-x-2"><Button variant="outline">Поделиться</Button><Button><Plus size={16} className="mr-2" />Добавить позицию</Button></div></div></div><div className="card"><div className="space-y-8"><div><h3 className="text-lg font-semibold mb-2">Работы</h3>{workItems.length > 0 ? <div className="overflow-x-auto"><table className="w-full"><thead><tr className="text-sm text-gray-500 text-left"><th>Наименование</th><th className="text-center">Кол-во</th><th>Ед.</th><th className="text-right">Цена</th><th className="text-right">Сумма</th><th></th></tr></thead><tbody className="divide-y">{workItems.map(item => <tr key={item.id}><td className="py-2">{item.name}</td><td className="py-2 text-center">{item.quantity}</td><td className="py-2">{item.unit}</td><td className="py-2 text-right currency">{formatCurrency(item.unit_price)}</td><td className="py-2 text-right font-semibold currency">{formatCurrency(item.total_price)}</td><td className="text-right"><button className="text-gray-400 hover:text-red-600"><Trash2 size={16}/></button></td></tr>)}</tbody></table></div> : <p className="text-sm text-gray-500">Нет работ</p>}</div><div><h3 className="text-lg font-semibold mb-2">Материалы</h3>{materialItems.length > 0 ? <div className="overflow-x-auto"><table className="w-full"><thead><tr className="text-sm text-gray-500 text-left"><th>Наименование</th><th className="text-center">Кол-во</th><th>Ед.</th><th className="text-right">Цена</th><th className="text-right">Сумма</th><th></th></tr></thead><tbody className="divide-y">{materialItems.map(item => <tr key={item.id}><td className="py-2">{item.name}</td><td className="py-2 text-center">{item.quantity}</td><td className="py-2">{item.unit}</td><td className="py-2 text-right currency">{formatCurrency(item.unit_price)}</td><td className="py-2 text-right font-semibold currency">{formatCurrency(item.total_price)}</td><td className="text-right"><button className="text-gray-400 hover:text-red-600"><Trash2 size={16}/></button></td></tr>)}</tbody></table></div> : <p className="text-sm text-gray-500">Нет материалов</p>}</div><div className="mt-8 flex justify-end"><div className="w-full max-w-sm space-y-3 pt-4 border-t"><div className="flex justify-between"><span className="text-gray-600">Итого по работам:</span><span className="font-medium">{formatCurrency(quote.work_amount)}</span></div><div className="flex justify-between"><span className="text-gray-600">Итого по материалам:</span><span className="font-medium">{formatCurrency(quote.material_amount)}</span></div><div className="flex justify-between text-xl font-bold border-t pt-3"><span>Всего:</span><span>{formatCurrency(quote.total_amount)}</span></div></div></div></div></div></div>
    );
};

const ProfilePage: React.FC = () => {
    const { user, updateProfile } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const { register, handleSubmit, formState: { errors, isDirty } } = useForm<Partial<User>>({
        defaultValues: { first_name: user?.first_name, last_name: user?.last_name, company_name: user?.company_name, phone: user?.phone }
    });
    const onSubmit = async (data: Partial<User>) => {
        setIsLoading(true);
        try {
            await updateProfile(data);
            toast.success('Профиль обновлен');
        } catch (error) { } 
        finally { setIsLoading(false); }
    };
    if (!user) return null;
    return (
        <div className="space-y-6"><h1 className="text-2xl font-bold">Профиль</h1>
            <div className="card max-w-2xl"><form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="flex items-center space-x-4"><div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-gray-500"><User size={32} /></div><div><h3 className="text-lg font-medium">{user.display_name}</h3><p className="text-sm text-gray-500">{user.email}</p></div></div>
                <div className="grid md:grid-cols-2 gap-6">
                    <div><label htmlFor="first_name" className="form-label">Имя</label><input id="first_name" type="text" className="form-input" {...register('first_name', { required: 'Имя обязательно' })} />{errors.first_name && <p className="form-error">{errors.first_name.message}</p>}</div>
                    <div><label htmlFor="last_name" className="form-label">Фамилия</label><input id="last_name" type="text" className="form-input" {...register('last_name', { required: 'Фамилия обязательна' })} />{errors.last_name && <p className="form-error">{errors.last_name.message}</p>}</div>
                </div>
                <div><label htmlFor="company_name" className="form-label">Название компании</label><input id="company_name" type="text" className="form-input" {...register('company_name')} /></div>
                <div><label htmlFor="phone" className="form-label">Телефон</label><input id="phone" type="tel" className="form-input" {...register('phone')} /></div>
                <div className="flex justify-end"><Button type="submit" loading={isLoading} disabled={!isDirty}>Сохранить</Button></div>
            </form></div>
        </div>
    );
};

const SubscriptionPage: React.FC = () => (
    <div className="space-y-6"><h1 className="text-2xl font-bold">Подписка</h1><div className="card text-center"><p>Страница управления подпиской находится в разработке.</p></div></div>
);

// --- APP SETUP ---
const queryClient = new QueryClient();

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="spinner h-8 w-8"></div></div>;
    return user ? <Layout>{children}</Layout> : <Navigate to="/login" replace />;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="spinner h-8 w-8"></div></div>;
    return user ? <Navigate to="/projects" replace /> : <>{children}</>;
};

const App = () => (
    <QueryClientProvider client={queryClient}>
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
                    <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
                    <Route path="/projects" element={<ProtectedRoute><ProjectsListPage /></ProtectedRoute>} />
                    <Route path="/projects/new" element={<ProtectedRoute><CreateProjectPage /></ProtectedRoute>} />
                    <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetailPage /></ProtectedRoute>} />
                    <Route path="/quotes/:id" element={<ProtectedRoute><QuoteDetailPage /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                    <Route path="/subscription" element={<ProtectedRoute><SubscriptionPage /></ProtectedRoute>} />
                    <Route path="/" element={<Navigate to="/projects" replace />} />
                    <Route path="*" element={<Navigate to="/projects" replace />} />
                </Routes>
                <Toaster position="top-right" />
            </Router>
        </AuthProvider>
    </QueryClientProvider>
);

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<React.StrictMode><App /></React.StrictMode>);