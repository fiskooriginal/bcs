# Python Script Scheduler Service

Веб-приложение для управления и планирования выполнения Python-скриптов с потоковой передачей логов в реальном времени.

## Возможности

- **Управление скриптами**: Создание, редактирование, импорт и управление Python-скриптами через веб-интерфейс
- **Планирование по Cron**: Планирование скриптов с помощью cron-выражений через APScheduler
- **Логи в реальном времени**: Потоковая передача логов через WebSocket во время выполнения скрипта
- **История выполнений**: Отслеживание всех запусков с подробными логами и статусами
- **Monaco Editor**: Полнофункциональный редактор кода с подсветкой синтаксиса Python
- **REST API**: Backend на FastAPI с набором API endpoints

## Технологический стек

**Backend:**

- Python 3.12, FastAPI, Uvicorn
- APScheduler 4 (async) с хранилищем SQLAlchemy
- SQLAlchemy 2.x (async) + asyncpg
- Alembic для миграций базы данных
- WebSocket для потоковой передачи логов в реальном времени

**Frontend:**

- React 18 + TypeScript + Vite
- TailwindCSS + shadcn/ui
- TanStack Query (React Query)
- Monaco Editor
- cronstrue для человекочитаемых описаний cron-выражений

**Инфраструктура:**

- Docker Compose (3 контейнера)
- serve для раздачи статики frontend
- PostgreSQL 16

## Быстрый старт

### Требования

- Docker и Docker Compose
- Git

### Установка

1. Клонируйте репозиторий:

```bash
git clone <repository-url>
cd bcs
```

1. Создайте файл окружения:

```bash
cp .env.sample .env
```

1. Отредактируйте `.env` и задайте значения:
   - `POSTGRES_PASSWORD`: Установите надёжный пароль
   - `SECRET_KEY`: Сгенерируйте случайный ключ (минимум 32 символа)

2. Запустите приложение:

```bash
# Быстрый запуск (пересоберёт backend с начальными скриптами)
./rebuild-and-start.sh

# Или стандартный способ
docker-compose up -d
```

1. Дождитесь готовности всех сервисов:

```bash
docker-compose ps
```

1. Откройте приложение:
   - **Frontend**: <http://localhost:3001>
   - **Backend API**: <http://localhost:8001>
   - **Документация API**: <http://localhost:8001/docs>

### Начальные скрипты

При первом запуске автоматически импортируются три примера скриптов:

1. **Resource Availability Monitor** - Мониторинг доступности веб-ресурсов (каждую минуту)
2. **Disk Space Monitor** - Проверка дискового пространства (каждый час)
3. **System Time Report** - Отчет о системном времени в разных часовых поясах (каждые 6 часов)

Все скрипты асинхронные и готовы к использованию. Просто активируйте их в веб-интерфейсе!

### Остановка приложения

```bash
docker-compose down
```

Для удаления всех данных (включая базу данных и скрипты):

```bash
docker-compose down -v
```

## Разработка

### Backend

Код backend монтируется как volume, изменения применяются без пересборки:

```bash
# Просмотр логов backend
docker-compose logs -f backend

# Вход в контейнер backend
docker-compose exec backend bash

# Выполнение миграций
docker-compose exec backend alembic upgrade head

# Создание новой миграции
docker-compose exec backend alembic revision --autogenerate -m "описание"
```

### Frontend

Для разработки frontend с hot reload:

```bash
cd frontend
npm install
npm run dev
```

Обновите `VITE_API_URL` и `VITE_WS_URL` в локальном `.env` для подключения к backend.

## API Endpoints

### Скрипты

- `GET /api/scripts` — Список всех скриптов
- `POST /api/scripts` — Создать скрипт
- `GET /api/scripts/{id}` — Получить скрипт
- `PUT /api/scripts/{id}` — Обновить метаданные скрипта
- `DELETE /api/scripts/{id}` — Удалить скрипт
- `GET /api/scripts/{id}/content` — Получить исходный код скрипта
- `PUT /api/scripts/{id}/content` — Обновить исходный код скрипта
- `POST /api/scripts/import` — Импортировать .py файл

### Планирование

- `POST /api/scripts/{id}/activate` — Активировать расписание cron
- `POST /api/scripts/{id}/deactivate` — Отключить расписание
- `POST /api/scripts/{id}/run` — Запустить скрипт немедленно
- `POST /api/executions/{id}/stop` — Остановить выполняющийся скрипт

### Выполнения и логи

- `GET /api/scripts/{id}/executions` — История выполнений скрипта
- `GET /api/executions/{id}/logs` — Логи выполнения

### WebSocket

- `WS /api/ws/logs/{execution_id}` — Потоковая передача логов в реальном времени

## Схема базы данных

Приложение использует PostgreSQL с тремя основными таблицами:

- **scripts**: Метаданные скриптов (имя, файл, cron-выражение, статус)
- **script_executions**: История выполнений (статус, временные метки, коды выхода)
- **script_logs**: Построчные логи (stdout/stderr)

## Порты

- **Frontend**: 3001
- **Backend**: 8001
- **PostgreSQL**: 5433 (маппинг с 5432 в контейнере)

## Архитектура

Приложение состоит из трёх Docker-контейнеров:

1. **postgres**: База данных PostgreSQL 16
2. **backend**: FastAPI-приложение с APScheduler
3. **frontend**: React SPA, раздаётся через Nginx

Все контейнеры общаются через выделенную Docker-сеть. Скрипты хранятся в Docker volume, подключённом к контейнеру backend.

## Лицензия

MIT License. См. файл [LICENSE](LICENSE).
