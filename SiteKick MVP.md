SiteKick MVP

# SiteKick MVP - Архитектурный план и структура проекта

## 1. Технологический стек (утвержден)

### Backend
- **Python 3.11+ с Django 4.2+**
- **Django REST Framework** для API
- **PostgreSQL** как основная БД
- **Redis** для кеширования и сессий
- **Celery** для фоновых задач (отправка email, обработка платежей)

### Frontend
- **React 18** с TypeScript
- **Tailwind CSS** для стилизации
- **Axios** для HTTP-запросов
- **React Query** для управления состоянием сервера
- **React Hook Form** для работы с формами

### Инфраструктура
- **Docker & Docker Compose** для локальной разработки и деплоя
- **Nginx** как reverse proxy
- **Timeweb VPS** для хостинга
- **Let's Encrypt** для SSL

### Внешние сервисы
- **ЮKassa** для платежей (упрощенная схема без рекуррентов)
- **SendGrid** для email-рассылки
- **AWS S3** (или аналог) для хранения файлов (чеки, логотипы)

## 2. Структура базы данных

```sql
-- Основные сущности
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    phone VARCHAR(50),
    logo_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    address TEXT,
    status VARCHAR(20) DEFAULT 'active', -- active, completed, archived
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE quotes (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    public_id VARCHAR(50) UNIQUE NOT NULL, -- для публичных ссылок
    total_amount DECIMAL(12, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE quote_items (
    id SERIAL PRIMARY KEY,
    quote_id INTEGER REFERENCES quotes(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL, -- work, material
    unit VARCHAR(50) NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE user_catalog_items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    default_price DECIMAL(10, 2),
    usage_count INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE expenses (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    receipt_photo_url VARCHAR(500),
    expense_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE project_payments (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    description VARCHAR(255),
    payment_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE subscription_payments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    payment_provider_id VARCHAR(255),
    status VARCHAR(20), -- pending, completed, failed
    payment_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 3. API Endpoints (REST)

### Аутентификация
```
POST /api/auth/register/          # Регистрация
POST /api/auth/login/             # Вход
POST /api/auth/logout/            # Выход
POST /api/auth/password-reset/    # Сброс пароля
GET  /api/auth/me/                # Профиль пользователя
PUT  /api/auth/me/                # Обновление профиля
```

### Проекты
```
GET    /api/projects/             # Список проектов
POST   /api/projects/             # Создание проекта
GET    /api/projects/{id}/        # Детали проекта
PUT    /api/projects/{id}/        # Обновление проекта
DELETE /api/projects/{id}/        # Удаление проекта
GET    /api/projects/{id}/dashboard/ # Финансовый дашборд
```

### Сметы
```
GET    /api/projects/{id}/quotes/     # Сметы проекта
POST   /api/projects/{id}/quotes/     # Создание сметы
GET    /api/quotes/{id}/              # Детали сметы
PUT    /api/quotes/{id}/              # Обновление сметы
DELETE /api/quotes/{id}/              # Удаление сметы
GET    /api/quotes/{public_id}/public/ # Публичная страница сметы
```

### Позиции смет
```
POST   /api/quotes/{id}/items/        # Добавление позиции
PUT    /api/quote-items/{id}/         # Обновление позиции
DELETE /api/quote-items/{id}/         # Удаление позиции
```

### Персональный справочник
```
GET    /api/catalog/                  # Мои часто используемые позиции
POST   /api/catalog/                  # Добавление в справочник
GET    /api/catalog/search/?q=text    # Поиск по справочнику
```

### Расходы и доходы
```
GET    /api/projects/{id}/expenses/   # Расходы по проекту
POST   /api/projects/{id}/expenses/   # Добавление расхода
GET    /api/projects/{id}/payments/   # Платежи по проекту
POST   /api/projects/{id}/payments/   # Добавление платежа
```

### Подписка
```
GET    /api/subscription/status/      # Статус подписки
POST   /api/subscription/payment/     # Инициация платежа
POST   /api/subscription/webhook/     # Webhook от ЮKassa
```

## 4. Структура React-приложения

```
src/
├── components/              # Переиспользуемые компоненты
│   ├── ui/                 # Базовые UI компоненты
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   └── ...
│   ├── layout/             # Компоненты макета
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── Layout.tsx
│   └── forms/              # Формы
│       ├── ProjectForm.tsx
│       ├── QuoteItemForm.tsx
│       └── ...
├── pages/                  # Страницы приложения
│   ├── auth/
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   └── ResetPasswordPage.tsx
│   ├── projects/
│   │   ├── ProjectsListPage.tsx
│   │   ├── ProjectDetailPage.tsx
│   │   └── CreateProjectPage.tsx
│   ├── quotes/
│   │   ├── QuoteDetailPage.tsx
│   │   ├── PublicQuotePage.tsx
│   │   └── CreateQuotePage.tsx
│   ├── subscription/
│   │   └── SubscriptionPage.tsx
│   └── ProfilePage.tsx
├── hooks/                  # Кастомные хуки
│   ├── useAuth.tsx
│   ├── useProjects.tsx
│   ├── useQuotes.tsx
│   └── ...
├── services/               # API сервисы
│   ├── api.ts             # Базовые настройки axios
│   ├── auth.ts            # Аутентификация
│   ├── projects.ts        # Работа с проектами
│   ├── quotes.ts          # Работа со сметами
│   └── ...
├── types/                  # TypeScript типы
│   ├── auth.ts
│   ├── project.ts
│   ├── quote.ts
│   └── ...
├── utils/                  # Утилиты
│   ├── formatters.ts      # Форматирование чисел, дат
│   ├── validators.ts      # Валидация форм
│   └── constants.ts       # Константы
├── App.tsx
├── main.tsx
└── index.css
```

## 5. Docker-конфигурация

### docker-compose.yml для разработки
```yaml
version: '3.8'

services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: sitekick
      POSTGRES_USER: sitekick_user
      POSTGRES_PASSWORD: dev_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7
    ports:
      - "6379:6379"

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    volumes:
      - ./backend:/app
    ports:
      - "8000:8000"
    depends_on:
      - db
      - redis
    environment:
      - DEBUG=True
      - DATABASE_URL=postgresql://sitekick_user:dev_password@db:5432/sitekick
      - REDIS_URL=redis://redis:6379/0

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    volumes:
      - ./frontend:/app
      - /app/node_modules
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=http://localhost:8000

volumes:
  postgres_data:
```

## 6. План разработки (8 недель)

### Недели 1-2: Фундамент
- [x] Настройка окружения разработки (Docker, БД, базовые настройки Django)
- [x] Реализация аутентификации (регистрация, логин, восстановление пароля)
- [x] Базовая структура React-приложения
- [x] Модель User и базовые API endpoints
- [x] Деплой на Timeweb с базовой настройкой сервера

### Недели 3-4: Ядро продукта (Проекты и Сметы)
- [ ] Модели Projects, Clients, Quotes, QuoteItems
- [ ] CRUD операции для проектов
- [ ] Создание и редактирование смет с позициями
- [ ] Реализация личного справочника (автодополнение)
- [ ] Публичная страница сметы (вместо PDF)

### Недели 5-6: Финансовый учет
- [ ] Модели Expenses и ProjectPayments
- [ ] Загрузка фото чеков (без OCR)
- [ ] Финансовый дашборд проекта
- [ ] Расчет прибыли в реальном времени

### Недели 7-8: Монетизация и полировка
- [ ] Интеграция с ЮKassa (простые разовые платежи)
- [ ] Система триала и блокировки доступа
- [ ] Email-уведомления (регистрация, окончание триала)
- [ ] Админ-панель Django
- [ ] Финальное тестирование и баг-фиксы

## 7. Следующие шаги

1. **Подтверждение архитектуры** - нужно ваше одобрение предложенного стека и структуры
2. **Настройка окружения** - создание репозитория, базовая настройка Docker
3. **Создание макетов** - простые wireframes ключевых экранов
4. **Начало разработки** - реализация аутентификации как первого модуля

Готов приступить к реализации! Есть ли какие-то корректировки в архитектуре или можем переходить к настройке окружения?




