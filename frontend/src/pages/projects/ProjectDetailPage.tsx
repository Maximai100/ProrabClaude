import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getProject } from '../../services/projects';
import { ArrowLeft, Edit, Plus, FileText, DollarSign, Receipt } from 'lucide-react';
import Button from '../../components/ui/Button';

const formatCurrency = (value: string | number) => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
  }).format(Number(value));
};

const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const projectId = Number(id);

  const { data: project, isLoading, error } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => getProject(projectId),
    enabled: !!projectId,
  });

  if (isLoading) {
    return <div className="spinner h-8 w-8 mx-auto mt-10"></div>;
  }

  if (error || !project) {
    return <div className="text-center text-red-600">Не удалось загрузить проект.</div>;
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div>
            <Link
            to="/projects"
            className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
            >
            <ArrowLeft size={16} className="mr-2" />
            Назад к проектам
            </Link>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        {project.address}
                    </p>
                </div>
                <div className="mt-4 sm:mt-0">
                    <Button variant="outline">
                        <Edit size={16} className="mr-2" />
                        Редактировать
                    </Button>
                </div>
            </div>
        </div>

        {/* Financial Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card text-center">
                <p className="text-sm text-gray-500">Сумма смет</p>
                <p className="text-xl font-bold currency">{formatCurrency(project.total_quote_amount)}</p>
            </div>
            <div className="card text-center">
                <p className="text-sm text-gray-500">Расходы</p>
                <p className="text-xl font-bold currency">{formatCurrency(project.total_expenses)}</p>
            </div>
            <div className="card text-center">
                <p className="text-sm text-gray-500">Оплачено</p>
                <p className="text-xl font-bold currency">{formatCurrency(project.total_payments_received)}</p>
            </div>
            <div className="card text-center">
                <p className="text-sm text-gray-500">Прибыль</p>
                <p className={`text-xl font-bold currency ${Number(project.expected_profit) >= 0 ? 'currency-positive' : 'currency-negative'}`}>
                    {formatCurrency(project.expected_profit)}
                </p>
            </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quotes */}
            <div className="card space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold flex items-center"><FileText size={20} className="mr-2"/>Сметы</h2>
                    <Button size="sm"><Plus size={14} className="mr-1"/>Создать смету</Button>
                </div>
                {project.quotes.length > 0 ? (
                    <ul className="divide-y">
                    {project.quotes.map(quote => (
                        <li key={quote.id} className="py-2 flex justify-between items-center">
                            <Link to={`/quotes/${quote.id}`} className="text-blue-600 hover:underline">{quote.title}</Link>
                            <span className="font-medium currency">{formatCurrency(quote.total_amount)}</span>
                        </li>
                    ))}
                    </ul>
                ) : (
                    <p className="text-sm text-gray-500 text-center py-4">Смет пока нет</p>
                )}
            </div>

            {/* Expenses */}
            <div className="card space-y-4">
                 <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold flex items-center"><Receipt size={20} className="mr-2"/>Расходы</h2>
                    <Button size="sm"><Plus size={14} className="mr-1"/>Добавить расход</Button>
                </div>
                 {project.expenses.length > 0 ? (
                    <ul className="divide-y">
                    {project.expenses.map(expense => (
                        <li key={expense.id} className="py-2 flex justify-between items-center">
                            <span>{expense.description || "Расход"} <span className="text-xs text-gray-400">({new Date(expense.expense_date).toLocaleDateString()})</span></span>
                            <span className="font-medium currency">{formatCurrency(expense.amount)}</span>
                        </li>
                    ))}
                    </ul>
                ) : (
                    <p className="text-sm text-gray-500 text-center py-4">Расходов пока нет</p>
                )}
            </div>
        </div>

    </div>
  );
};

export default ProjectDetailPage;
