import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { createProject, getClients, createClient } from '../../services/projects';
import { Client, Project } from '../../types/project';
import Button from '../../components/ui/Button';
import { ArrowLeft } from 'lucide-react';

interface FormData {
  title: string;
  address: string;
  client_id?: number | string;
  new_client_name?: string;
  new_client_phone?: string;
  new_client_email?: string;
  notes: string;
}

const CreateProjectPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
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
  
  const createProjectMutation = useMutation<Project, Error, Partial<Project>>({
    mutationFn: createProject,
    onSuccess: (data) => {
        toast.success('Проект создан успешно!');
        queryClient.invalidateQueries({ queryKey: ['projects'] });
        navigate(`/projects/${data.id}`);
    },
    onError: () => {
        toast.error('Ошибка создания проекта');
    }
  });

  const createClientMutation = useMutation<Client, Error, Partial<Client>>({
    mutationFn: createClient,
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['clients'] });
    }
  });

  const clientId = watch('client_id');
  const isNewClient = clientId === '-1';

  const onSubmit = async (data: FormData) => {
    let finalClientId: number | undefined = typeof data.client_id === 'string' || data.client_id === undefined ? undefined : Number(data.client_id);
    
    try {
        if (isNewClient && data.new_client_name) {
            const newClient = await createClientMutation.mutateAsync({
                name: data.new_client_name,
                phone: data.new_client_phone || '',
                email: data.new_client_email || '',
            });
            finalClientId = newClient.id;
        }

        await createProjectMutation.mutateAsync({
            title: data.title,
            address: data.address,
            client_id: finalClientId,
            notes: data.notes,
        });
    } catch(error) {
        console.error(error);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft size={16} className="mr-2" />
          Назад к проектам
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Новый проект</h1>
        <p className="mt-1 text-sm text-gray-500">
          Заполните информацию, чтобы создать новый объект для работы
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
              rows={2}
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
              {...register('client_id', {})}
            >
              <option value="">Без клиента</option>
              <option value="-1">+ Создать нового клиента</option>
              {clients.map((client: Client) => (
                <option key={client.id} value={client.id}>
                  {client.name} {client.phone && `(${client.phone})`}
                </option>
              ))}
            </select>
          </div>

          {/* New Client Fields */}
          {isNewClient && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-4 border border-gray-200">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/projects')}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              loading={createProjectMutation.isLoading || createClientMutation.isLoading}
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