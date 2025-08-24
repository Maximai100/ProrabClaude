# docker-compose.yml
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
      - ./backend/sql:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U sitekick_user -d sitekick"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    volumes:
      - ./backend:/app
      - static_volume:/app/staticfiles
      - media_volume:/app/media
    ports:
      - "8000:8000"
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    environment:
      - DEBUG=True
      - SECRET_KEY=django-insecure-dev-key-for-development-only
      - DB_NAME=sitekick
      - DB_USER=sitekick_user
      - DB_PASSWORD=dev_password
      - DB_HOST=db
      - DB_PORT=5432
      - REDIS_URL=redis://redis:6379/0
      - ALLOWED_HOSTS=localhost,127.0.0.1,backend
    command: >
      sh -c "python manage.py migrate &&
             python manage.py collectstatic --noinput &&
             python manage.py runserver 0.0.0.0:8000"

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
      - REACT_APP_PUBLIC_URL=http://localhost:3000
      - NODE_ENV=development
      - WATCHPACK_POLLING=true
    command: npm start
    stdin_open: true
    tty: true

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - static_volume:/static
      - media_volume:/media
    depends_on:
      - backend
      - frontend

volumes:
  postgres_data:
  redis_data:
  static_volume:
  media_volume:

---

# backend/Dockerfile.dev
FROM python:3.11-slim

WORKDIR /app

# Устанавливаем системные зависимости
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    libjpeg-dev \
    zlib1g-dev \
    libfreetype6-dev \
    liblcms2-dev \
    libopenjp2-7-dev \
    libtiff5-dev \
    tk-dev \
    tcl-dev \
    libharfbuzz-dev \
    libfribidi-dev \
    libxcb1-dev \
    && rm -rf /var/lib/apt/lists/*

# Устанавливаем Python зависимости
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копируем код приложения
COPY . .

# Создаем необходимые директории
RUN mkdir -p logs staticfiles media

EXPOSE 8000

# Команда запуска будет переопределена в docker-compose.yml
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]

---

# backend/requirements.txt
Django==4.2.5
djangorestframework==3.14.0
djangorestframework-simplejwt==5.2.2
django-cors-headers==4.2.0
django-redis==5.3.0
django-extensions==3.2.3
psycopg2-binary==2.9.7
Pillow==10.0.0
celery==5.3.1
redis==4.6.0
python-decouple==3.8
requests==2.31.0

# Для email отправки
sendgrid==6.10.0

# Для работы с файлами
django-storages==1.13.2
boto3==1.28.25  # Если будем использовать S3

# Для разработки
django-debug-toolbar==4.2.0
factory-boy==3.3.0
pytest==7.4.0
pytest-django==4.5.2

---

# frontend/Dockerfile.dev
FROM node:18-alpine

WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем исходный код
COPY . .

EXPOSE 3000

CMD ["npm", "start"]

---

# frontend/package.json
{
  "name": "sitekick-frontend",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "@testing-library/jest-dom": "^5.17.0",
    "@testing-library/react": "^13.4.0",
    "@testing-library/user-event": "^14.4.3",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "react-router-dom": "^6.15.0",
    "axios": "^1.5.0",
    "@tanstack/react-query": "^4.32.0",
    "react-hook-form": "^7.45.4",
    "@hookform/resolvers": "^3.3.1",
    "yup": "^1.2.0",
    "react-hot-toast": "^2.4.1",
    "lucide-react": "^0.263.1",
    "date-fns": "^2.30.0",
    "clsx": "^2.0.0",
    "typescript": "^4.9.5",
    "@types/node": "^16.18.39",
    "@types/react": "^18.2.15",
    "@types/react-dom": "^18.2.7"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  },
  "devDependencies": {
    "tailwindcss": "^3.3.0",
    "autoprefixer": "^10.4.14",
    "postcss": "^8.4.27",
    "@tailwindcss/forms": "^0.5.4"
  },
  "proxy": "http://backend:8000"
}

---

# nginx/nginx.conf
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    upstream backend {
        server backend:8000;
    }

    upstream frontend {
        server frontend:3000;
    }

    server {
        listen 80;
        server_name localhost;

        # Размер загружаемых файлов
        client_max_body_size 10M;

        # API запросы
        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Админка Django
        location /admin/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Публичные страницы смет
        location /quotes/public/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Статические файлы Django
        location /static/ {
            alias /static/;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # Медиа файлы Django
        location /media/ {
            alias /media/;
            expires 1y;
            add_header Cache-Control "public";
        }

        # React приложение
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # WebSocket для React Hot Reload
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }
    }
}

---

# backend/manage.py
#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys

if __name__ == '__main__':
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sitekick.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)

---

# backend/sitekick/wsgi.py
"""
WSGI config for sitekick project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/howto/deployment/wsgi/
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sitekick.settings')

application = get_wsgi_application()

---

# backend/apps/__init__.py

---

# backend/apps/users/__init__.py

---

# backend/apps/projects/__init__.py

---

# backend/apps/quotes/__init__.py

---

# backend/apps/payments/__init__.py

---

# backend/apps/payments/models.py

from django.db import models
from django.conf import settings
from decimal import Decimal


class SubscriptionPayment(models.Model):
    """Модель платежей за подписку"""
    
    STATUS_CHOICES = [
        ('pending', 'Ожидает оплаты'),
        ('processing', 'Обрабатывается'),
        ('succeeded', 'Успешно'),
        ('failed', 'Ошибка'),
        ('canceled', 'Отменен'),
    ]
    
    PLAN_CHOICES = [
        ('monthly', 'Месячная подписка'),
        ('quarterly', 'Квартальная подписка'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='payments')
    plan = models.CharField('Тарифный план', max_length=20, choices=PLAN_CHOICES)
    amount = models.DecimalField('Сумма', max_digits=10, decimal_places=2)
    
    # Данные от платежной системы
    payment_id = models.CharField('ID платежа', max_length=255, unique=True)
    payment_provider = models.CharField('Провайдер', max_length=50, default='yookassa')
    status = models.CharField('Статус', max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Метаданные
    payment_url = models.URLField('Ссылка для оплаты', blank=True)
    confirmation_token = models.CharField('Токен подтверждения', max_length=255, blank=True)
    
    # Временные метки
    created_at = models.DateTimeField('Создан', auto_now_add=True)
    paid_at = models.DateTimeField('Оплачен', null=True, blank=True)
    expires_at = models.DateTimeField('Истекает', null=True, blank=True)
    
    class Meta:
        verbose_name = 'Платеж за подписку'
        verbose_name_plural = 'Платежи за подписку'
        ordering = ['-created_at']
        
    def __str__(self):
        return f"{self.user.email} - {self.amount} руб. ({self.get_status_display()})"


# backend/apps/payments/serializers.py

from rest_framework import serializers
from .models import SubscriptionPayment


class SubscriptionPaymentSerializer(serializers.ModelSerializer):
    """Сериализатор для платежей за подписку"""
    
    class Meta:
        model = SubscriptionPayment
        fields = [
            'id', 'plan', 'amount', 'status', 'payment_url', 
            'created_at', 'paid_at', 'expires_at'
        ]
        read_only_fields = ['payment_url', 'paid_at']


class CreatePaymentSerializer(serializers.Serializer):
    """Сериализатор для создания платежа"""
    
    plan = serializers.ChoiceField(choices=SubscriptionPayment.PLAN_CHOICES)
    
    def validate_plan(self, value):
        if value not in dict(SubscriptionPayment.PLAN_CHOICES):
            raise serializers.ValidationError("Неверный тарифный план")
        return value

---

# .env.example
# Django Settings
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DB_NAME=sitekick
DB_USER=sitekick_user
DB_PASSWORD=your-db-password
DB_HOST=localhost
DB_PORT=5432

# Redis
REDIS_URL=redis://127.0.0.1:6379/0

# Email (SendGrid)
SENDGRID_API_KEY=your-sendgrid-api-key
DEFAULT_FROM_EMAIL=noreply@yourdomain.com

# Payment (ЮKassa)
YOOKASSA_SHOP_ID=your-yookassa-shop-id
YOOKASSA_SECRET_KEY=your-yookassa-secret-key
PAYMENT_SUCCESS_URL=http://localhost:3000/subscription/success
PAYMENT_CANCEL_URL=http://localhost:3000/subscription/cancel

# URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000

---

# README.md
# SiteKick - SaaS для малых строительных бригад

## Описание проекта

SiteKick - это современное веб-приложение для автоматизации работы малых строительных и ремонтных бригад. Система позволяет быстро создавать профессиональные сметы, контролировать расходы и отслеживать прибыльность проектов.

## Ключевые возможности

- 📋 **Быстрое создание смет** с персональным справочником работ и материалов
- 💰 **Финансовый учет** - контроль расходов и доходов по проектам
- 📊 **Дашборд прибыльности** - мгновенная оценка финансового состояния объектов
- 🔗 **Публичные ссылки на сметы** для отправки клиентам
- 📱 **Mobile-First дизайн** для работы прямо на стройплощадке
- 💳 **Гибкая система подписки** с триальным периодом

## Технологический стек

### Backend
- Python 3.11 + Django 4.2
- Django REST Framework
- PostgreSQL
- Redis
- JWT аутентификация

### Frontend  
- React 18 + TypeScript
- Tailwind CSS
- React Query
- React Hook Form

### Инфраструктура
- Docker & Docker Compose
- Nginx
- SendGrid (email)
- ЮKassa (платежи)

## Быстрый старт

### Предварительные требования

- Docker и Docker Compose
- Git

### Установка

1. **Клонируйте репозиторий**
```bash
git clone https://github.com/yourusername/sitekick.git
cd sitekick
```

2. **Создайте файл окружения**
```bash
cp .env.example .env
# Отредактируйте .env файл с вашими настройками
```

3. **Запустите проект**
```bash
docker-compose up --build
```

4. **Создайте суперпользователя** (в новом терминале)
```bash
docker-compose exec backend python manage.py createsuperuser
```

### Доступ к приложению

- **Фронтенд**: http://localhost:3000
- **API**: http://localhost:8000/api/
- **Админка**: http://localhost:8000/admin/

## Структура проекта

```
sitekick/
├── backend/                 # Django API
│   ├── apps/
│   │   ├── users/          # Пользователи и аутентификация
│   │   ├── projects/       # Проекты и клиенты
│   │   ├── quotes/         # Сметы и справочник
│   │   └── payments/       # Подписки и платежи
│   ├── sitekick/           # Настройки Django
│   └── requirements.txt
├── frontend/               # React приложение
│   ├── src/
│   │   ├── components/     # React компоненты
│   │   ├── pages/          # Страницы приложения
│   │   ├── services/       # API сервисы
│   │   └── types/          # TypeScript типы
│   └── package.json
├── nginx/                  # Конфигурация Nginx
├── docker-compose.yml      # Docker конфигурация
└── README.md
```

## API Endpoints

### Аутентификация
```
POST /api/auth/register/     # Регистрация
POST /api/auth/login/        # Вход
GET  /api/auth/profile/      # Профиль пользователя
```

### Проекты
```
GET    /api/projects/        # Список проектов
POST   /api/projects/        # Создание проекта
GET    /api/projects/{id}/   # Детали проекта
```

### Сметы
```
GET    /api/quotes/projects/{id}/quotes/  # Сметы проекта
POST   /api/quotes/projects/{id}/quotes/  # Создание сметы
GET    /api/quotes/public/{public_id}/    # Публичная смета
```

Полная документация API доступна по адресу: http://localhost:8000/api/docs/

## Развертывание в продакшене

### 1. Подготовка сервера

```bash
# Обновляем систему
sudo apt update && sudo apt upgrade -y

# Устанавливаем Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Устанавливаем Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Настройка проекта

```bash
# Клонируем репозиторий
git clone https://github.com/yourusername/sitekick.git
cd sitekick

# Настраиваем окружение для продакшена
cp .env.example .env.prod
# Редактируем .env.prod с реальными данными

# Создаем продакшен конфигурацию
cp docker-compose.yml docker-compose.prod.yml
# Настраиваем docker-compose.prod.yml для продакшена
```

### 3. Запуск

```bash
# Запускаем в продакшн режиме
docker-compose -f docker-compose.prod.yml up -d

# Применяем миграции
docker-compose -f docker-compose.prod.yml exec backend python manage.py migrate

# Собираем статику
docker-compose -f docker-compose.prod.yml exec backend python manage.py collectstatic --noinput
```

## Разработка

### Установка для разработки

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# или
venv\Scripts\activate     # Windows
pip install -r requirements.txt

# Frontend  
cd frontend
npm install
```

### Запуск в режиме разработки

```bash
# Backend (в первом терминале)
cd backend
python manage.py runserver

# Frontend (во втором терминале)
cd frontend  
npm start
```

### Тестирование

```bash
# Backend тесты
cd backend
python manage.py test

# Frontend тесты
cd frontend
npm test
```

## Лицензия

Этот проект лицензирован под MIT License - см. файл [LICENSE](LICENSE) для деталей.

## Поддержка

Если у вас есть вопросы или предложения, создайте issue в этом репозитории или свяжитесь с нами по email: support@sitekick.app
