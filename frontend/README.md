# Frontend - Планировщик Python-скриптов

React frontend для управления и планирования Python-скриптов.

## Технологический стек

- React 18 + TypeScript
- Vite (инструмент сборки)
- TailwindCSS (стилизация)
- shadcn/ui (UI-компоненты)
- TanStack Query (получение данных)
- Monaco Editor (редактор кода)
- Axios (HTTP-клиент)
- cronstrue (парсер cron-выражений)

## Разработка

```bash
# Установка зависимостей
npm install

# Запуск сервера разработки
npm run dev

# Сборка для production
npm run build

# Предварительный просмотр production-сборки
npm run preview

# Проверка кода линтером
npm run lint
```

## Переменные окружения

Создайте файл `.env` для настройки подключения к бэкенду:

```env
# URL API и WebSocket для подключения к бэкенду
VITE_API_URL=http://localhost:8001/api
VITE_WS_URL=ws://localhost:8001/api
```

## Структура проекта

```
src/
├── api/              # API-клиент и функции сервисов
│   ├── client.ts     # Экземпляр Axios
│   ├── scripts.ts    # API-вызовы для скриптов
│   └── executions.ts # API-вызовы для выполнений
├── components/       # React-компоненты
│   ├── ui/          # компоненты shadcn/ui
│   ├── ScriptList.tsx
│   ├── ScriptCard.tsx
│   ├── ScriptEditor.tsx
│   ├── CronEditor.tsx
│   ├── LogViewer.tsx
│   ├── CreateScriptDialog.tsx
│   └── ImportScriptDialog.tsx
├── hooks/           # Пользовательские React-хуки
│   ├── useScripts.ts
│   ├── useExecutions.ts
│   └── useWebSocket.ts
├── types/           # Определения типов TypeScript
│   └── index.ts
├── lib/             # Вспомогательные функции
│   └── utils.ts
├── App.tsx          # Главный компонент приложения
├── main.tsx         # Точка входа
└── index.css        # Глобальные стили
```

## Возможности

- Создание, редактирование и удаление Python-скриптов
- Импорт существующих .py файлов
- Планирование скриптов с помощью cron-выражений
- Активация/деактивация запланированных заданий
- Ручной запуск скриптов
- Потоковая передача логов в реальном времени через WebSocket
- История выполнений с логами
- Редактор кода Monaco с подсветкой синтаксиса Python
