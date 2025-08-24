import React from 'react';
import { NavLink } from 'react-router-dom';
import { FolderOpen, Plus, CreditCard } from 'lucide-react';

const Sidebar: React.FC = () => {
  const navItems = [
    {
      name: 'Все проекты',
      href: '/projects',
      icon: FolderOpen,
      exact: true,
    },
    {
      name: 'Создать проект',
      href: '/projects/new',
      icon: Plus,
    },
    {
      name: 'Подписка',
      href: '/subscription',
      icon: CreditCard,
    },
  ];

  return (
    <aside className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64 bg-white border-r border-gray-200">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <nav className="mt-5 flex-1 px-2 space-y-1">
            {navItems.map((item) => (
                <NavLink
                key={item.name}
                to={item.href}
                end={item.exact}
                className={({ isActive }) =>
                    `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive
                        ? 'bg-blue-100 text-blue-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`
                }
                >
                <item.icon
                    className={`mr-3 flex-shrink-0 h-5 w-5 ${
                        'text-gray-400 group-hover:text-gray-500'
                    }`}
                    aria-hidden="true"
                />
                {item.name}
                </NavLink>
            ))}
            </nav>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
