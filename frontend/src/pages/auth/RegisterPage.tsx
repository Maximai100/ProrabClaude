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
