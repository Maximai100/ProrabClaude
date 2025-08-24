# SiteKick - SaaS для малых строительных бригад

## Описание проекта

SiteKick - это современное веб-приложение для автоматизации работы малых строительных и ремонтных бригад. Система позволяет быстро создавать профессиональные сметы, контролировать расходы и отслеживать прибыльность проектов.

## Технологический стек

- **Backend**: Python 3.11, Django 4.2, Django REST Framework, Gunicorn
- **Frontend**: React 18, TypeScript, Tailwind CSS
- **База данных**: PostgreSQL
- **Кэш/Задачи**: Redis, Celery (в планах)
- **Инфраструктура**: Docker, Docker Compose, Nginx

---

## 🚀 Быстрый старт (Локальная разработка)

### 1. Предварительные требования
- Docker и Docker Compose
- Git
- Make (опционально, для удобства)

### 2. Установка
```bash
# Клонируйте репозиторий
git clone https://github.com/yourusername/sitekick.git
cd sitekick

# Создайте .env файл для локальной разработки
cp .env.example .env

# Запустите проект с помощью Makefile (рекомендуется)
make dev-setup

# Или вручную
# docker-compose build
# docker-compose up -d
# docker-compose exec backend python manage.py migrate
# docker-compose exec backend python manage.py create_demo_user
```

### 3. Доступ к приложению
- **Фронтенд**: [http://localhost:3000](http://localhost:3000)
- **API**: [http://localhost:8000/api/](http://localhost:8000/api/)
- **Админка**: [http://localhost:8000/admin/](http://localhost:8000/admin/)

### 4. Демо-пользователь
- **Email**: `demo@sitekick.app`
- **Пароль**: `demo123456`

---

## ⚙️ Развертывание на сервере (Production)

### 1. Подготовка сервера
- **Установите Docker и Docker Compose.**
- **Клонируйте репозиторий:** `git clone ...`
- **Перейдите в директорию проекта:** `cd sitekick`

### 2. Конфигурация
- **Создайте файл с переменными окружения для production:**
  ```bash
  cp .env.example .env.prod
  ```
- **Отредактируйте `.env.prod`:**
  - `DEBUG=False`
  - `SECRET_KEY` - сгенерируйте новый, надежный ключ.
  - `ALLOWED_HOSTS` - укажите ваш домен (например, `sitekick.app,www.sitekick.app`).
  - `CORS_ALLOWED_ORIGINS` и `CSRF_TRUSTED_ORIGINS` - укажите URL вашего фронтенда (например, `https://sitekick.app`).
  - Настройте `DB_PASSWORD` и другие переменные.

- **Настройте Nginx:**
  - Откройте `nginx/nginx.prod.conf`.
  - Замените `your_domain.com` на ваш реальный домен.

### 3. Получение SSL-сертификатов (Let's Encrypt)
1. Установите Certbot: `sudo apt-get install certbot python3-certbot-nginx`.
2. В файле `docker-compose.prod.yml` раскомментируйте volume `certbot_certs`.
3. Запустите Nginx: `make prod-up`.
4. Получите сертификаты:
   ```bash
   # Запустите Certbot в контейнере Nginx
   docker-compose -f docker-compose.prod.yml exec nginx certbot --nginx -d your_domain.com
   ```
5. В `nginx/nginx.prod.conf` раскомментируйте блок `server` для порта `443` и редирект с `80` порта.
6. Перезапустите Nginx: `docker-compose -f docker-compose.prod.yml restart nginx`.

### 4. Запуск проекта
```bash
# Сборка и запуск production-контейнеров
make prod-build
make prod-up

# Применение миграций базы данных
make prod-migrate

# (Опционально) Создание суперпользователя в production
docker-compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser
```

### 5. Полезные команды для Production
- `make prod-down` - остановить production-сервисы.
- `make prod-logs` - посмотреть логи.
- `make prod-clean` - остановить и удалить все, включая volumes (ОСТОРОЖНО, ДАННЫЕ БУДУТ УДАЛЕНЫ).

---

## Структура проекта
```
sitekick/
├── backend/            # Django API
├── frontend/           # React приложение
├── nginx/              # Конфигурация Nginx
├── docker-compose.yml  # Docker для разработки
├── docker-compose.prod.yml # Docker для production
└── Makefile            # Утилита для управления
```
