import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { User } from '../types/auth';
import Button from '../components/ui/Button';
import { User as UserIcon } from 'lucide-react';

type ProfileFormData = Pick<User, 'first_name' | 'last_name' | 'company_name' | 'phone'>;

const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    defaultValues: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      company_name: user?.company_name || '',
      phone: user?.phone || '',
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    try {
      await updateProfile(data);
      toast.success('Профиль успешно обновлен');
    } catch (error) {
      toast.error('Не удалось обновить профиль');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null; // or a loading spinner
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Профиль</h1>
        <p className="mt-1 text-sm text-gray-500">
          Управляйте информацией вашего аккаунта
        </p>
      </div>

      <div className="card max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
              <UserIcon size={32} />
            </div>
            <div>
              <h3 className="text-lg font-medium">{user.display_name}</h3>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="first_name" className="form-label">
                Имя
              </label>
              <input
                id="first_name"
                type="text"
                className="form-input"
                {...register('first_name', { required: 'Имя обязательно' })}
              />
              {errors.first_name && <p className="form-error">{errors.first_name.message}</p>}
            </div>

            <div>
              <label htmlFor="last_name" className="form-label">
                Фамилия
              </label>
              <input
                id="last_name"
                type="text"
                className="form-input"
                {...register('last_name', { required: 'Фамилия обязательна' })}
              />
              {errors.last_name && <p className="form-error">{errors.last_name.message}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="company_name" className="form-label">
              Название компании
            </label>
            <input
              id="company_name"
              type="text"
              className="form-input"
              {...register('company_name', { required: 'Название компании обязательно' })}
            />
            {errors.company_name && <p className="form-error">{errors.company_name.message}</p>}
          </div>

          <div>
            <label htmlFor="phone" className="form-label">
              Телефон
            </label>
            <input
              id="phone"
              type="tel"
              className="form-input"
              {...register('phone', { required: 'Телефон обязателен' })}
            />
            {errors.phone && <p className="form-error">{errors.phone.message}</p>}
          </div>

          <div className="flex justify-end">
            <Button type="submit" loading={isLoading} disabled={!isDirty}>
              Сохранить изменения
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
