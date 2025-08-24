import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getQuote } from '../../services/quotes';
import { ArrowLeft, Edit, Plus, Trash2 } from 'lucide-react';
import Button from '../../components/ui/Button';

const formatCurrency = (value: string | number) => new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(Number(value));

const QuoteDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const quoteId = Number(id);

  const { data: quote, isLoading, error } = useQuery({
    queryKey: ['quote', quoteId],
    queryFn: () => getQuote(quoteId),
    enabled: !!quoteId,
  });

  if (isLoading) {
    return <div className="spinner h-8 w-8 mx-auto mt-10"></div>;
  }

  if (error || !quote) {
    return <div className="text-center text-red-600">Не удалось загрузить смету.</div>;
  }

  const workItems = quote.items.filter(item => item.type === 'work');
  const materialItems = quote.items.filter(item => item.type === 'material');

  return (
    <div className="space-y-6">
        {/* Header */}
        <div>
            <Link
                to={`/projects/${quote.project_id}`} // Assuming project_id is available
                className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
            >
            <ArrowLeft size={16} className="mr-2" />
            Назад к проекту
            </Link>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{quote.title}</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Проект: {quote.project_title}
                    </p>
                </div>
                <div className="mt-4 sm:mt-0 flex space-x-2">
                    <Button variant="outline">Поделиться</Button>
                    <Button>
                        <Plus size={16} className="mr-2" />
                        Добавить позицию
                    </Button>
                </div>
            </div>
        </div>

        <div className="card">
            <div className="space-y-8">
                {/* Work Items */}
                <div>
                    <h3 className="text-lg font-semibold mb-2">Работы</h3>
                    {workItems.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="text-sm text-gray-500 text-left">
                                    <tr>
                                        <th className="p-2">Наименование</th>
                                        <th className="p-2 text-center">Кол-во</th>
                                        <th className="p-2 text-center">Ед.</th>
                                        <th className="p-2 text-right">Цена</th>
                                        <th className="p-2 text-right">Сумма</th>
                                        <th className="p-2"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                {workItems.map(item => (
                                    <tr key={item.id}>
                                        <td className="p-2">{item.name}</td>
                                        <td className="p-2 text-center">{item.quantity}</td>
                                        <td className="p-2 text-center">{item.unit}</td>
                                        <td className="p-2 text-right currency">{formatCurrency(item.unit_price)}</td>
                                        <td className="p-2 text-right font-semibold currency">{formatCurrency(item.total_price)}</td>
                                        <td className="p-2 text-right"><button className="text-gray-400 hover:text-red-600"><Trash2 size={16}/></button></td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    ): <p className="text-sm text-gray-500">Нет работ</p>}
                </div>
                {/* Material Items */}
                <div>
                    <h3 className="text-lg font-semibold mb-2">Материалы</h3>
                    {materialItems.length > 0 ? (
                        <div className="overflow-x-auto">
                           <table className="w-full">
                                <thead className="text-sm text-gray-500 text-left">
                                    <tr>
                                        <th className="p-2">Наименование</th>
                                        <th className="p-2 text-center">Кол-во</th>
                                        <th className="p-2 text-center">Ед.</th>
                                        <th className="p-2 text-right">Цена</th>
                                        <th className="p-2 text-right">Сумма</th>
                                        <th className="p-2"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                {materialItems.map(item => (
                                    <tr key={item.id}>
                                        <td className="p-2">{item.name}</td>
                                        <td className="p-2 text-center">{item.quantity}</td>
                                        <td className="p-2 text-center">{item.unit}</td>
                                        <td className="p-2 text-right currency">{formatCurrency(item.unit_price)}</td>
                                        <td className="p-2 text-right font-semibold currency">{formatCurrency(item.total_price)}</td>
                                        <td className="p-2 text-right"><button className="text-gray-400 hover:text-red-600"><Trash2 size={16}/></button></td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    ): <p className="text-sm text-gray-500">Нет материалов</p>}
                </div>
                {/* Totals */}
                <div className="mt-8 flex justify-end">
                    <div className="w-full max-w-sm space-y-3 pt-4 border-t">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Итого по работам:</span>
                            <span className="font-medium">{formatCurrency(quote.work_amount)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Итого по материалам:</span>
                            <span className="font-medium">{formatCurrency(quote.material_amount)}</span>
                        </div>
                        <div className="flex justify-between text-xl font-bold border-t pt-3">
                            <span>Всего:</span>
                            <span>{formatCurrency(quote.total_amount)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default QuoteDetailPage;
