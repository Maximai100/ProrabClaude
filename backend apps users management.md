# backend/apps/users/management/commands/create_demo_user.py

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

User = get_user_model()

class Command(BaseCommand):
    help = 'Создает демо пользователя для тестирования'

    def handle(self, *args, **options):
        email = 'demo@sitekick.app'
        password = 'demo123456'
        
        # Удаляем существующего демо пользователя
        User.objects.filter(email=email).delete()
        
        # Создаем нового
        user = User.objects.create_user(
            email=email,
            password=password,
            first_name='Демо',
            last_name='Пользователь',
            company_name='Демо Бригада',
            phone='+7 (999) 123-45-67',
        )
        
        # Продлеваем триал на 30 дней для демо
        user.trial_ends_at = timezone.now() + timedelta(days=30)
        user.save()
        
        self.stdout.write(
            self.style.SUCCESS(f'Демо пользователь создан: {email} / {password}')
        )

---

# backend/apps/users/management/commands/create_sample_data.py

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta, date
from decimal import Decimal
import random

from apps.projects.models import Client, Project, Expense, ProjectPayment
from apps.quotes.models import Quote, QuoteItem, UserCatalogItem

User = get_user_model()

class Command(BaseCommand):
    help = 'Создает демо данные для тестирования'

    def add_arguments(self, parser):
        parser.add_argument(
            '--user-email',
            type=str,
            default='demo@sitekick.app',
            help='Email пользователя для создания данных'
        )

    def handle(self, *args, **options):
        try:
            user = User.objects.get(email=options['user_email'])
        except User.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'Пользователь {options["user_email"]} не найден')
            )
            return

        # Создаем клиентов
        clients_data = [
            {'name': 'Иван Петров', 'phone': '+7 (999) 111-11-11', 'email': 'petrov@example.com'},
            {'name': 'Мария Сидорова', 'phone': '+7 (999) 222-22-22', 'email': 'sidorova@example.com'},
            {'name': 'ООО "Рога и Копыта"', 'phone': '+7 (999) 333-33-33', 'email': 'info@rogakopyta.ru'},
        ]

        clients = []
        for client_data in clients_data:
            client, created = Client.objects.get_or_create(
                user=user,
                name=client_data['name'],
                defaults=client_data
            )
            clients.append(client)
            if created:
                self.stdout.write(f'Создан клиент: {client.name}')

        # Создаем справочник работ и материалов
        catalog_items = [
            # Электрика
            {'name': 'Установка подрозетника в бетоне', 'type': 'work', 'unit': 'шт', 'default_price': 300},
            {'name': 'Монтаж розетки', 'type': 'work', 'unit': 'шт', 'default_price': 200},
            {'name': 'Прокладка кабеля ВВГ-НГ 3x2.5', 'type': 'work', 'unit': 'м', 'default_price': 80},
            {'name': 'Установка выключателя', 'type': 'work', 'unit': 'шт', 'default_price': 150},
            {'name': 'Подрозетник бетон', 'type': 'material', 'unit': 'шт', 'default_price': 45},
            {'name': 'Розетка Legrand', 'type': 'material', 'unit': 'шт', 'default_price': 450},
            {'name': 'Кабель ВВГ-НГ 3x2.5', 'type': 'material', 'unit': 'м', 'default_price': 95},
            
            # Отделка
            {'name': 'Штукатурка стен', 'type': 'work', 'unit': 'м²', 'default_price': 600},
            {'name': 'Поклейка обоев', 'type': 'work', 'unit': 'м²', 'default_price': 400},
            {'name': 'Укладка ламината', 'type': 'work', 'unit': 'м²', 'default_price': 800},
            {'name': 'Грунтовка глубокого проникновения', 'type': 'material', 'unit': 'л', 'default_price': 180},
            {'name': 'Обои флизелиновые', 'type': 'material', 'unit': 'рулон', 'default_price': 2200},
            {'name': 'Ламинат 33 класс', 'type': 'material', 'unit': 'м²', 'default_price': 1250},
        ]

        for item_data in catalog_items:
            item, created = UserCatalogItem.objects.get_or_create(
                user=user,
                name=item_data['name'],
                type=item_data['type'],
                defaults=item_data
            )
            if created:
                self.stdout.write(f'Добавлена позиция в справочник: {item.name}')

        # Создаем проекты
        projects_data = [
            {
                'title': 'Ремонт квартиры на ул. Ленина, 15',
                'address': 'г. Москва, ул. Ленина, д. 15, кв. 42',
                'status': 'active',
                'client': clients[0],
                'notes': 'Двухкомнатная квартира, требуется полный ремонт'
            },
            {
                'title': 'Электромонтажные работы в офисе',
                'address': 'г. Москва, ул. Тверская, д. 5, офис 301',
                'status': 'active', 
                'client': clients[2],
                'notes': 'Замена электропроводки в офисном помещении'
            },
            {
                'title': 'Отделка дома в Подмосковье',
                'address': 'Московская обл., Одинцовский р-н, п. Лесной',
                'status': 'completed',
                'client': clients[1],
                'notes': 'Внутренняя отделка загородного дома'
            }
        ]

        for project_data in projects_data:
            project, created = Project.objects.get_or_create(
                user=user,
                title=project_data['title'],
                defaults=project_data
            )
            
            if created:
                self.stdout.write(f'Создан проект: {project.title}')
                
                # Создаем смету для каждого проекта
                quote = Quote.objects.create(
                    project=project,
                    title=f'Смета по проекту "{project.title}"',
                    notes='Основная смета по проекту'
                )

                # Добавляем позиции в смету
                if 'электро' in project.title.lower() or 'электро' in project.notes.lower():
                    # Электромонтажные работы
                    quote_items = [
                        {'name': 'Установка подрозетника в бетоне', 'type': 'work', 'unit': 'шт', 'quantity': 8, 'unit_price': 300},
                        {'name': 'Монтаж розетки', 'type': 'work', 'unit': 'шт', 'quantity': 8, 'unit_price': 200},
                        {'name': 'Прокладка кабеля ВВГ-НГ 3x2.5', 'type': 'work', 'unit': 'м', 'quantity': 50, 'unit_price': 80},
                        {'name': 'Подрозетник бетон', 'type': 'material', 'unit': 'шт', 'quantity': 8, 'unit_price': 45},
                        {'name': 'Розетка Legrand', 'type': 'material', 'unit': 'шт', 'quantity': 8, 'unit_price': 450},
                        {'name': 'Кабель ВВГ-НГ 3x2.5', 'type': 'material', 'unit': 'м', 'quantity': 55, 'unit_price': 95},
                    ]
                else:
                    # Отделочные работы
                    quote_items = [
                        {'name': 'Штукатурка стен', 'type': 'work', 'unit': 'м²', 'quantity': 25, 'unit_price': 600},
                        {'name': 'Поклейка обоев', 'type': 'work', 'unit': 'м²', 'quantity': 20, 'unit_price': 400},
                        {'name': 'Укладка ламината', 'type': 'work', 'unit': 'м²', 'quantity': 35, 'unit_price': 800},
                        {'name': 'Грунтовка глубокого проникновения', 'type': 'material', 'unit': 'л', 'quantity': 15, 'unit_price': 180},
                        {'name': 'Обои флизелиновые', 'type': 'material', 'unit': 'рулон', 'quantity': 8, 'unit_price': 2200},
                        {'name': 'Ламинат 33 класс', 'type': 'material', 'unit': 'м²', 'quantity': 38, 'unit_price': 1250},
                    ]

                for i, item_data in enumerate(quote_items):
                    QuoteItem.objects.create(
                        quote=quote,
                        order=i + 1,
                        **item_data
                    )

                # Пересчитываем суммы
                quote.calculate_totals()

                # Добавляем расходы
                if project.status == 'active':
                    # Для активных проектов добавляем несколько расходов
                    expenses_data = [
                        {'amount': Decimal('5000'), 'description': 'Закупка материалов в Леруа', 'expense_date': date.today() - timedelta(days=3)},
                        {'amount': Decimal('2500'), 'description': 'Инструмент и расходники', 'expense_date': date.today() - timedelta(days=1)},
                    ]
                    
                    for expense_data in expenses_data:
                        Expense.objects.create(project=project, **expense_data)

                    # Добавляем платежи от клиента
                    payments_data = [
                        {'amount': quote.total_amount * Decimal('0.5'), 'description': 'Предоплата 50%', 'payment_date': date.today() - timedelta(days=5)},
                    ]
                    
                    for payment_data in payments_data:
                        ProjectPayment.objects.create(project=project, **payment_data)

                elif project.status == 'completed':
                    # Для завершенных проектов добавляем все расходы и платежи
                    total_materials_cost = sum(
                        item.total_price for item in quote.items.filter(type='material')
                    )
                    
                    Expense.objects.create(
                        project=project,
                        amount=total_materials_cost,
                        description='Материалы по проекту',
                        expense_date=date.today() - timedelta(days=10)
                    )
                    
                    ProjectPayment.objects.create(
                        project=project,
                        amount=quote.total_amount,
                        description='Полная оплата по проекту',
                        payment_date=date.today() - timedelta(days=2)
                    )

        self.stdout.write(
            self.style.SUCCESS(f'Демо данные созданы для пользователя {user.email}')
        )

---

# Makefile

.PHONY: help build up down logs shell migrate test clean demo

help: ## Показать справку
	@echo "Доступные команды:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $1, $2}'

build: ## Собрать контейнеры
	docker-compose build

up: ## Запустить все сервисы
	docker-compose up -d

down: ## Остановить все сервисы
	docker-compose down

logs: ## Показать логи всех сервисов
	docker-compose logs -f

logs-backend: ## Показать логи backend
	docker-compose logs -f backend

logs-frontend: ## Показать логи frontend
	docker-compose logs -f frontend

shell: ## Войти в контейнер backend
	docker-compose exec backend python manage.py shell

backend-bash: ## Войти в bash контейнера backend
	docker-compose exec backend bash

frontend-bash: ## Войти в bash контейнера frontend
	docker-compose exec frontend sh

migrate: ## Применить миграции
	docker-compose exec backend python manage.py migrate

makemigrations: ## Создать миграции
	docker-compose exec backend python manage.py makemigrations

createsuperuser: ## Создать суперпользователя
	docker-compose exec backend python manage.py createsuperuser

collectstatic: ## Собрать статические файлы
	docker-compose exec backend python manage.py collectstatic --noinput

demo: ## Создать демо данные
	docker-compose exec backend python manage.py create_demo_user
	docker-compose exec backend python manage.py create_sample_data

test-backend: ## Запустить тесты backend
	docker-compose exec backend python manage.py test

test-frontend: ## Запустить тесты frontend
	docker-compose exec frontend npm test

clean: ## Очистить все контейнеры и volumes
	docker-compose down -v
	docker system prune -a --volumes -f

restart: ## Перезапустить все сервисы
	docker-compose restart

dev-setup: build migrate demo ## Первичная настройка для разработки
	@echo "🚀 Проект готов к работе!"
	@echo "Frontend: http://localhost:3000"
	@echo "Backend API: http://localhost:8000/api/"
	@echo "Admin: http://localhost:8000/admin/"
	@echo "Демо пользователь: demo@sitekick.app / demo123456"

---

# docker-compose.override.yml
# Этот файл автоматически применяется для локальной разработки

version: '3.8'

services:
  backend:
    environment:
      - DEBUG=True
      - LOG_LEVEL=DEBUG
    volumes:
      # Монтируем код для hot reload
      - ./backend:/app
    command: >
      sh -c "python manage.py migrate &&
             python manage.py collectstatic --noinput &&
             python manage.py runserver 0.0.0.0:8000"

  frontend:
    environment:
      - NODE_ENV=development
      - CHOKIDAR_USEPOLLING=true
      - WATCHPACK_POLLING=true
    volumes:
      - ./frontend:/app
      - /app/node_modules

---

# .gitignore
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
share/python-wheels/
*.egg-info/
.installed.cfg
*.egg
MANIFEST

# Django
*.log
local_settings.py
db.sqlite3
db.sqlite3-journal
media/
staticfiles/

# Virtual Environment
venv/
env/
ENV/

# Node
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# React
/frontend/build/
.env.local
.env.development.local
.env.test.local
.env.production.local

# Environment files
.env
.env.prod
.env.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Docker
.docker/

# Logs
logs/
*.log

# Temp files
*.tmp
*.temp

---

# backend/apps/users/management/__init__.py

---

# backend/apps/users/management/commands/__init__.py

---

# backend/templates/emails/welcome.html
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Добро пожаловать в SiteKick!</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: #2563eb;
            color: white;
            padding: 30px 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }
        .content {
            background: white;
            padding: 30px 20px;
            border: 1px solid #e5e7eb;
            border-top: none;
            border-radius: 0 0 8px 8px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .trial-info {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
        }
        .button {
            display: inline-block;
            background: #2563eb;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            color: #6b7280;
            font-size: 14px;
            margin-top: 30px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">SiteKick</div>
        <h1>Добро пожаловать!</h1>
    </div>
    
    <div class="content">
        <p>Привет, {{ user.display_name }}!</p>
        
        <p>Спасибо за регистрацию в SiteKick! Теперь вы можете управлять своими строительными проектами профессионально и эффективно.</p>
        
        <div class="trial-info">
            <strong>🎉 Ваш триальный период начался!</strong><br>
            У вас есть {{ trial_days }} дня бесплатного доступа ко всем возможностям SiteKick:
            <ul>
                <li>Неограниченное количество проектов</li>
                <li>Создание профессиональных смет</li>
                <li>Контроль финансов по объектам</li>
                <li>Публичные ссылки для клиентов</li>
            </ul>
        </div>
        
        <h3>С чего начать?</h3>
        <ol>
            <li><strong>Создайте первый проект</strong> - добавьте информацию о строительном объекте</li>
            <li><strong>Составьте смету</strong> - используйте наш удобный конструктор</li>
            <li><strong>Поделитесь с клиентом</strong> - отправьте красивую ссылку на смету</li>
            <li><strong>Ведите учет</strong> - добавляйте расходы и платежи</li>
        </ol>
        
        <div style="text-align: center;">
            <a href="{{ frontend_url }}" class="button">Начать работу</a>
        </div>
        
        <h3>Нужна помощь?</h3>
        <p>Если у вас возникнут вопросы, мы всегда готовы помочь:</p>
        <ul>
            <li>📧 Email: support@sitekick.app</li>
            <li>📱 Telegram: @sitekick_support</li>
            <li>📞 Телефон: +7 (999) 123-45-67</li>
        </ul>
        
        <p>Удачи в работе!<br>
        Команда SiteKick</p>
    </div>
    
    <div class="footer">
        <p>SiteKick - ваш помощник на объекте</p>
        <p>Если вы не регистрировались в SiteKick, просто проигнорируйте это письмо</p>
    </div>
</body>
</html>

---

# README_QUICK_START.md
# SiteKick - Быстрый старт

## 🚀 Запуск проекта за 5 минут

### 1. Предварительные требования
- Docker и Docker Compose
- Git

### 2. Клонирование и запуск
```bash
# Клонируем репозиторий
git clone https://github.com/yourusername/sitekick.git
cd sitekick

# Создаем файл окружения
cp .env.example .env

# Запускаем проект (первичная настройка)
make dev-setup
```

### 3. Доступ к приложению
- **Фронтенд**: http://localhost:3000
- **API**: http://localhost:8000/api/
- **Админка**: http://localhost:8000/admin/

### 4. Демо данные
**Тестовый пользователь:**
- Email: `demo@sitekick.app`
- Пароль: `demo123456`

В аккаунте уже созданы примеры проектов, смет и клиентов.

### 5. Полезные команды
```bash
# Просмотр логов
make logs

# Перезапуск сервисов
make restart

# Создание суперпользователя
make createsuperuser

# Остановка проекта
make down
```

## 📱 Основные функции

1. **Создание проектов** - добавьте информацию о строительном объекте
2. **Составление смет** - используйте персональный справочник работ
3. **Публичные ссылки** - делитесь сметами с клиентами
4. **Финансовый учет** - контролируйте расходы и прибыль
5. **Мобильная адаптация** - работайте прямо на объекте

## 🔧 Разработка

### Структура проекта
```
sitekick/
├── backend/           # Django API
├── frontend/          # React приложение  
├── nginx/             # Конфигурация веб-сервера
├── docker-compose.yml # Docker конфигурация
└── Makefile          # Команды для разработки
```

### Горячая перезагрузка
Код автоматически перезагружается при изменениях:
- Backend: Django development server
- Frontend: React Hot Reload

### Тестирование
```bash
# Backend тесты
make test-backend

# Frontend тесты  
make test-frontend
```

Готово! 🎉 SiteKick запущен и готов к работе.
