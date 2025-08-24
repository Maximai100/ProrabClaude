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
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Ваш доступ ограничен. 
                <Link to="/subscription" className="font-medium underline hover:text-yellow-800 ml-1">
                  Оформите подписку
                </Link> чтобы продолжить создавать и редактировать проекты.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
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
            className="form-input pr-10 appearance-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Все статусы</option>
            <option value="active">В работе</option>
            <option value="completed">Завершен</option>
            <option value="archived">Архивный</option>
          </select>
          <Filter size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
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
              className="card hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {project.title}
                    </h3>
                    {project.address && (
                      <p className="text-sm text-gray-500 mt-1 truncate">{project.address}</p>
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
                    <p className="font-semibold currency text-gray-800">
                      {formatCurrency(project.total_quote_amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Прибыль</p>
                    <p className={`font-semibold currency ${
                      parseFloat(project.expected_profit) >= 0 
                        ? 'currency-positive' 
                        : 'currency-negative'
                    }`}>
                      {formatCurrency(project.expected_profit)}
                    </p>
                  </div>
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
