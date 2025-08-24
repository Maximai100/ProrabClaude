// frontend/tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}

---

// frontend/postcss.config.js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}

---

// frontend/src/pages/auth/LoginPage.tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

import { useAuth } from '../../contexts/AuthContext';
import { LoginData } from '../../types/auth';
import Button from '../../components/ui/Button';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginData>();

  const onSubmit = async (data: LoginData) => {
    setIsLoading(true);
    try {
      await login(data);
    } catch (error) {
      // Ошибка обрабатывается в AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="bg-blue-600 text-white p-3 rounded-xl">
            <span className="font-bold text-2xl">SK</span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Вход в SiteKick
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Или{' '}
          <Link
            to="/register"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            зарегистрируйтесь бесплатно
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="form-label">
                Email адрес
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="form-input"
                {...register('email', {
                  required: 'Email обязателен',
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: 'Неверный формат email'
                  }
                })}
              />
              {errors.email && (
                <p className="form-error">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="form-label">
                Пароль
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="form-input pr-10"
                  {...register('password', {
                    required: 'Пароль обязателен'
                  })}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={16} className="text-gray-400" />
                  ) : (
                    <Eye size={16} className="text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="form-error">{errors.password.message}</p>
              )}
            </div>

            {/* Submit */}
            <div>
              <Button
                type="submit"
                loading={isLoading}
                className="w-full"
              >
                Войти
              </Button>
            </div>
          </form>

          {/* Demo info */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Для демо</span>
              </div>
            </div>

            <div className="mt-6">
              <div className="bg-gray-50 rounded-md p-4 text-sm">
                <p className="font-medium text-gray-900 mb-2">
                  Тестовый доступ:
                </p>
                <p className="text-gray-600">
                  Email: <code className="bg-white px-1 py-0.5 rounded">demo@sitekick.app</code>
                </p>
                <p className="text-gray-600">
                  Пароль: <code className="bg-white px-1 py-0.5 rounded">demo123456</code>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

---

// frontend/src/pages/auth/RegisterPage.tsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

import { useAuth } from '../../contexts/AuthContext';
import { RegisterData } from '../../types/auth';
import Button from '../../components/ui/Button';

const RegisterPage: React.FC = () => {
  const { register: registerUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterData>();

  const password = watch('password');

  const onSubmit = async (data: RegisterData) => {
    setIsLoading(true);
    try {
      await registerUser(data);
    } catch (error) {
      // Ошибка обрабатывается в AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="bg-blue-600 text-white p-3 rounded-xl">
            <span className="font-bold text-2xl">SK</span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Регистрация в SiteKick
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Уже есть аккаунт?{' '}
          <Link
            to="/login"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Войти
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="form-label">
                Email адрес
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="form-input"
                {...register('email', {
                  required: 'Email обязателен',
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: 'Неверный формат email'
                  }
                })}
              />
              {errors.email && (
                <p className="form-error">{errors.email.message}</p>
              )}
            </div>

            {/* Company Name */}
            <div>
              <label htmlFor="company_name" className="form-label">
                Название бригады/компании
              </label>
              <input
                id="company_name"
                type="text"
                className="form-input"
                placeholder="ООО Ремонт-Сервис"
                {...register('company_name', {
                  required: 'Название обязательно'
                })}
              />
              {errors.company_name && (
                <p className="form-error">{errors.company_name.message}</p>
              )}
            </div>

            {/* Name */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="first_name" className="form-label">
                  Имя
                </label>
                <input
                  id="first_name"
                  type="text"
                  autoComplete="given-name"
                  className="form-input"
                  {...register('first_name', {
                    required: 'Имя обязательно'
                  })}
                />
                {errors.first_name && (
                  <p className="form-error">{errors.first_name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="last_name" className="form-label">
                  Фамилия
                </label>
                <input
                  id="last_name"
                  type="text"
                  autoComplete="family-name"
                  className="form-input"
                  {...register('last_name', {
                    required: 'Фамилия обязательна'
                  })}
                />
                {errors.last_name && (
                  <p className="form-error">{errors.last_name.message}</p>
                )}
              </div>
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="form-label">
                Телефон
              </label>
              <input
                id="phone"
                type="tel"
                autoComplete="tel"
                className="form-input"
                placeholder="+7 (999) 123-45-67"
                {...register('phone', {
                  required: 'Телефон обязателен'
                })}
              />
              {errors.phone && (
                <p className="form-error">{errors.phone.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="form-label">
                Пароль
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className="form-input pr-10"
                  {...register('password', {
                    required: 'Пароль обязателен',
                    minLength: {
                      value: 8,
                      message: 'Пароль должен быть не менее 8 символов'
                    }
                  })}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={16} className="text-gray-400" />
                  ) : (
                    <Eye size={16} className="text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="form-error">{errors.password.message}</p>
              )}
            </div>

            {/* Password Confirm */}
            <div>
              <label htmlFor="password_confirm" className="form-label">
                Подтвердите пароль
              </label>
              <input
                id="password_confirm"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                className="form-input"
                {...register('password_confirm', {
                  required: 'Подтверждение пароля обязательно',
                  validate: value => 
                    value === password || 'Пароли не совпадают'
                })}
              />
              {errors.password_confirm && (
                <p className="form-error">{errors.password_confirm.message}</p>
              )}
            </div>

            {/* Trial info */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-blue-800">
                    <strong>3 дня бесплатно!</strong> Попробуйте все возможности SiteKick без ограничений.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div>
              <Button
                type="submit"
                loading={isLoading}
                className="w-full"
              >
                Создать аккаунт
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Регистрируясь, вы соглашаетесь с{' '}
              <a href="#" className="text-blue-600 hover:text-blue-500">
                условиями использования
              </a>{' '}
              и{' '}
              <a href="#" className="text-blue-600 hover:text-blue-500">
                политикой конфиденциальности
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

---

// frontend/src/pages/projects/ProjectsListPage.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Filter, FolderOpen } from 'lucide-react';

import { getProjects } from '../../services/projects';
import { Project } from '../../types/project';
import Button from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';

const ProjectsListPage: React.FC = () => {
  const { hasActiveAccess } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data: projects = [], isLoading, error } = useQuery({
    queryKey: ['projects', { search: searchTerm, status: statusFilter }],
    queryFn: () => getProjects({ search: searchTerm || undefined, status: statusFilter || undefined }),
  });

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(parseFloat(value));
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      active: { label: 'В работе', className: 'status-active' },
      completed: { label: 'Завершен', className: 'status-completed' },
      archived: { label: 'Архивный', className: 'status-archived' },
    };
    const statusInfo = statusMap[status as keyof typeof statusMap];
    return (
      <span className={statusInfo?.className}>
        {statusInfo?.label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner h-8 w-8"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Ошибка загрузки проектов</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Проекты</h1>
          <p className="mt-1 text-sm text-gray-500">
            Управляйте своими строительными проектами
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link to="/projects/new">
            <Button disabled={!hasActiveAccess}>
              <Plus size={16} className="mr-2" />
              Новый проект
            </Button>
          </Link>
        </div>
      </div>

      {!hasActiveAccess && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-800">
                Ваш триальный период истек. 
                <Link to="/subscription" className="font-medium underline ml-1">
                  Оформите подписку
                </Link> чтобы продолжить создавать проекты.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Поиск по названию или адресу..."
            className="pl-10 form-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative">
          <select
            className="form-input pr-10"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Все статусы</option>
            <option value="active">В работе</option>
            <option value="completed">Завершен</option>
            <option value="archived">Архивный</option>
          </select>
          <Filter size={16} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="text-center py-12">
          <FolderOpen size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Пока нет проектов
          </h3>
          <p className="text-gray-500 mb-6">
            Создайте свой первый проект, чтобы начать работу со сметами
          </p>
          <Link to="/projects/new">
            <Button disabled={!hasActiveAccess}>
              <Plus size={16} className="mr-2" />
              Создать первый проект
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project: Project) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="card hover:shadow-md transition-shadow cursor-pointer"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-medium text-gray-900 truncate">
                    {project.title}
                  </h3>
                  {project.address && (
                    <p className="text-sm text-gray-500 mt-1">{project.address}</p>
                  )}
                </div>
                {getStatusBadge(project.status)}
              </div>

              {/* Client */}
              {project.client && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Клиент:</span> {project.client.name}
                  </p>
                </div>
              )}

              {/* Finance Summary */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Смета</p>
                  <p className="font-medium currency">
                    {formatCurrency(project.total_quote_amount)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Прибыль</p>
                  <p className={`font-medium currency ${
                    parseFloat(project.expected_profit) >= 0 
                      ? 'currency-positive' 
                      : 'currency-negative'
                  }`}>
                    {formatCurrency(project.expected_profit)}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Создан {new Date(project.created_at).toLocaleDateString('ru-RU')}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectsListPage;

---

// frontend/src/pages/projects/CreateProjectPage.tsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { createProject, getClients, createClient } from '../../services/projects';
import { Project, Client } from '../../types/project';
import Button from '../../components/ui/Button';
import { ArrowLeft, Plus } from 'lucide-react';

interface FormData {
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
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingNewClient, setIsCreatingNewClient] = useState(false);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => getClients(),
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>();

  const clientId = watch('client_id');
  const isNewClient = clientId === -1;

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      let finalClientId = data.client_id === -1 ? undefined : data.client_id;

      // Создаем нового клиента если нужно
      if (isNewClient && data.new_client_name) {
        const newClient = await createClient({
          name: data.new_client_name,
          phone: data.new_client_phone || '',
          email: data.new_client_email || '',
        });
        finalClientId = newClient.id;
      }

      // Создаем проект
      const project = await createProject({
        title: data.title,
        address: data.address,
        client_id: finalClientId,
        notes: data.notes,
      });

      toast.success('Проект создан успешно!');
      navigate(`/projects/${project.id}`);
    } catch (error: any) {
      toast.error('Ошибка создания проекта');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft size={16} className="mr-2" />
          Назад к проектам
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Новый проект</h1>
        <p className="mt-1 text-sm text-gray-500">
          Создайте новый строительный проект
        </p>
      </div>

      {/* Form */}
      <div className="card">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Project Title */}
          <div>
            <label htmlFor="title" className="form-label">
              Название проекта *
            </label>
            <input
              id="title"
              type="text"
              className="form-input"
              placeholder="Ремонт квартиры на ул. Ленина, 10"
              {...register('title', {
                required: 'Название проекта обязательно'
              })}
            />
            {errors.title && (
              <p className="form-error">{errors.title.message}</p>
            )}
          </div>

          {/* Address */}
          <div>
            <label htmlFor="address" className="form-label">
              Адрес объекта
            </label>
            <textarea
              id="address"
              rows={3}
              className="form-input"
              placeholder="г. Москва, ул. Ленина, д. 10, кв. 25"
              {...register('address')}
            />
          </div>

          {/* Client Selection */}
          <div>
            <label htmlFor="client_id" className="form-label">
              Клиент
            </label>
            <select
              id="client_id"
              className="form-input"
              {...register('client_id', { valueAsNumber: true })}
            >
              <option value="">Без клиента</option>
              <option value={-1}>+ Создать нового клиента</option>
              {clients.map((client: Client) => (
                <option key={client.id} value={client.id}>
                  {client.name} {client.phone && `(${client.phone})`}
                </option>
              ))}
            </select>
          </div>

          {/* New Client Fields */}
          {isNewClient && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
              <h4 className="font-medium text-gray-900">Данные нового клиента</h4>
              
              <div>
                <label htmlFor="new_client_name" className="form-label">
                  Имя клиента *
                </label>
                <input
                  id="new_client_name"
                  type="text"
                  className="form-input"
                  placeholder="Иван Иванов"
                  {...register('new_client_name', {
                    required: isNewClient ? 'Имя клиента обязательно' : false
                  })}
                />
                {errors.new_client_name && (
                  <p className="form-error">{errors.new_client_name.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="new_client_phone" className="form-label">
                    Телефон
                  </label>
                  <input
                    id="new_client_phone"
                    type="tel"
                    className="form-input"
                    placeholder="+7 (999) 123-45-67"
                    {...register('new_client_phone')}
                  />
                </div>
                <div>
                  <label htmlFor="new_client_email" className="form-label">
                    Email
                  </label>
                  <input
                    id="new_client_email"
                    type="email"
                    className="form-input"
                    placeholder="client@example.com"
                    {...register('new_client_email')}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="form-label">
              Заметки
            </label>
            <textarea
              id="notes"
              rows={4}
              className="form-input"
              placeholder="Дополнительная информация о проекте..."
              {...register('notes')}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/projects')}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              loading={isLoading}
            >
              Создать проект
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProjectPage;
