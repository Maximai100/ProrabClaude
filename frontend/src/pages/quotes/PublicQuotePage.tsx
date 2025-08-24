import React from 'react';
import { useParams } from 'react-router-dom';
// This would be a public, un-authenticated fetch
// For now, we'll just mock the structure

// Mock data
const mockQuote = {
    title: "Смета по проекту 'Ремонт квартиры на ул. Ленина, 15'",
    project_title: "Ремонт квартиры на ул. Ленина, 15",
    client_name: "Иван Петров",
    created_at: new Date().toISOString(),
    work_amount: "53000.00",
    material_amount: "68025.00",
    total_amount: "121025.00",
    work_items: [
        { id: 1, name: 'Штукатурка стен', quantity: '25.00', unit: 'м²', unit_price: '600.00', total_price: '15000.00' },
        { id: 2, name: 'Поклейка обоев', quantity: '20.00', unit: 'м²', unit_price: '400.00', total_price: '8000.00' },
        { id: 3, name: 'Укладка ламината', quantity: '35.00', unit: 'м²', unit_price: '800.00', total_price: '28000.00' },
    ],
    material_items: [
        { id: 4, name: 'Грунтовка глубокого проникновения', quantity: '15.00', unit: 'л', unit_price: '180.00', total_price: '2700.00' },
        { id: 5, name: 'Обои флизелиновые', quantity: '8.00', unit: 'рулон', unit_price: '2200.00', total_price: '17600.00' },
        { id: 6, name: 'Ламинат 33 класс', quantity: '38.00', unit: 'м²', unit_price: '1250.00', total_price: '47500.00' },
    ],
    contractor: {
        company_name: "Демо Бригада",
        name: "Демо Пользователь",
        phone: "+7 (999) 123-45-67",
        email: "demo@sitekick.app",
    }
};

const formatCurrency = (value: string | number) => new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(Number(value));

const PublicQuotePage: React.FC = () => {
  const { publicId } = useParams<{ publicId: string }>();
  // In a real app, you would fetch data here based on publicId
  // const { data: quote, isLoading, error } = useQuery(...)

  const quote = mockQuote;

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg">
        <header className="bg-gray-800 text-white p-8 rounded-t-lg">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold">{quote.contractor.company_name}</h1>
                    <p className="text-gray-300">{quote.contractor.name}</p>
                    <p className="text-gray-300">{quote.contractor.phone} | {quote.contractor.email}</p>
                </div>
                <div className="text-right">
                    <h2 className="text-2xl font-semibold">Смета</h2>
                    <p className="text-gray-300">Дата: {new Date(quote.created_at).toLocaleDateString('ru-RU')}</p>
                </div>
            </div>
        </header>
        
        <main className="p-8">
            <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                    <h3 className="font-semibold text-gray-500 uppercase tracking-wide text-sm">Проект</h3>
                    <p className="text-lg font-medium text-gray-900">{quote.project_title}</p>
                </div>
                <div>
                    <h3 className="font-semibold text-gray-500 uppercase tracking-wide text-sm">Клиент</h3>
                    <p className="text-lg font-medium text-gray-900">{quote.client_name}</p>
                </div>
            </div>

            {/* Items Table */}
            <div className="space-y-6">
                {/* Work Items */}
                <div>
                    <h4 className="text-xl font-semibold mb-2 border-b pb-2">Работы</h4>
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-sm text-gray-500">
                                <th className="py-2">Наименование</th>
                                <th className="py-2 text-center">Кол-во</th>
                                <th className="py-2 text-center">Ед.</th>
                                <th className="py-2 text-right">Цена</th>
                                <th className="py-2 text-right">Сумма</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {quote.work_items.map(item => (
                                <tr key={item.id}>
                                    <td className="py-2">{item.name}</td>
                                    <td className="py-2 text-center">{item.quantity}</td>
                                    <td className="py-2 text-center">{item.unit}</td>
                                    <td className="py-2 text-right">{formatCurrency(item.unit_price)}</td>
                                    <td className="py-2 text-right font-medium">{formatCurrency(item.total_price)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                 {/* Material Items */}
                 <div>
                    <h4 className="text-xl font-semibold mb-2 border-b pb-2">Материалы</h4>
                    <table className="w-full text-left">
                       <thead>
                            <tr className="text-sm text-gray-500">
                                <th className="py-2">Наименование</th>
                                <th className="py-2 text-center">Кол-во</th>
                                <th className="py-2 text-center">Ед.</th>
                                <th className="py-2 text-right">Цена</th>
                                <th className="py-2 text-right">Сумма</th>
                            </tr>
                        </thead>
                         <tbody className="divide-y">
                            {quote.material_items.map(item => (
                                <tr key={item.id}>
                                    <td className="py-2">{item.name}</td>
                                    <td className="py-2 text-center">{item.quantity}</td>
                                    <td className="py-2 text-center">{item.unit}</td>
                                    <td className="py-2 text-right">{formatCurrency(item.unit_price)}</td>
                                    <td className="py-2 text-right font-medium">{formatCurrency(item.total_price)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Totals */}
            <div className="mt-8 flex justify-end">
                <div className="w-full max-w-sm space-y-3">
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
        </main>
      </div>
       <div className="text-center mt-6">
            <button onClick={() => window.print()} className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Печать / Сохранить в PDF
            </button>
        </div>
    </div>
  );
};

export default PublicQuotePage;
