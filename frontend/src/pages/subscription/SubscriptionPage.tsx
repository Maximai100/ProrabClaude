import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { CheckCircle } from 'lucide-react';
import Button from '../../components/ui/Button';

const SubscriptionPage: React.FC = () => {
  const { user } = useAuth();

  const handlePayment = (plan: 'monthly' | 'quarterly') => {
    // API call to initiate payment would go here
    alert(`Initiating payment for ${plan} plan.`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Подписка</h1>
        <p className="mt-1 text-sm text-gray-500">
          Управляйте своим тарифным планом и доступом к сервису
        </p>
      </div>

      {/* Current Status */}
      <div className="card max-w-2xl">
        <h2 className="text-lg font-semibold mb-4">Текущий статус</h2>
        {user?.has_active_access ? (
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
            <p className="font-medium text-green-800">Ваша подписка активна</p>
            {user.access_expires_at && (
              <p className="text-sm text-green-700">
                Доступ действителен до: {new Date(user.access_expires_at).toLocaleDateString('ru-RU')}
              </p>
            )}
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
            <p className="font-medium text-red-800">Подписка неактивна</p>
            <p className="text-sm text-red-700">
              Оформите подписку, чтобы получить полный доступ ко всем функциям.
            </p>
          </div>
        )}
      </div>

      {/* Pricing Plans */}
      <div className="max-w-4xl">
        <h2 className="text-lg font-semibold mb-4">Тарифные планы</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Monthly Plan */}
          <div className="card flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold">Месячный</h3>
              <p className="text-3xl font-extrabold my-4">1 500 ₽ <span className="text-base font-normal text-gray-500">/ месяц</span></p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center"><CheckCircle size={16} className="text-green-500 mr-2"/> Неограниченно проектов</li>
                <li className="flex items-center"><CheckCircle size={16} className="text-green-500 mr-2"/> Неограниченно смет</li>
                <li className="flex items-center"><CheckCircle size={16} className="text-green-500 mr-2"/> Учет финансов</li>
                <li className="flex items-center"><CheckCircle size={16} className="text-green-500 mr-2"/> Поддержка по email</li>
              </ul>
            </div>
            <Button className="w-full mt-6" onClick={() => handlePayment('monthly')}>
              Выбрать тариф
            </Button>
          </div>

          {/* Quarterly Plan */}
           <div className="card flex flex-col justify-between border-2 border-blue-600 relative">
            <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">
                <span className="px-3 py-1 bg-blue-600 text-white text-sm font-semibold rounded-full">Выгодно</span>
            </div>
            <div>
              <h3 className="text-xl font-bold">Квартальный</h3>
              <p className="text-3xl font-extrabold my-4">4 000 ₽ <span className="text-base font-normal text-gray-500">/ 3 месяца</span></p>
              <p className="text-sm text-green-600 font-medium mb-4">Экономия 500 ₽!</p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center"><CheckCircle size={16} className="text-green-500 mr-2"/> Все функции месячного тарифа</li>
                <li className="flex items-center"><CheckCircle size={16} className="text-green-500 mr-2"/> Приоритетная поддержка</li>
              </ul>
            </div>
            <Button className="w-full mt-6" onClick={() => handlePayment('quarterly')}>
              Выбрать тариф
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;
