# Установка и запуск F1 Championship

## Предварительные требования

- Node.js 18+ и npm
- PostgreSQL 15+ (или Docker)
- Telegram Bot Token

## Получение Telegram Bot Token

1. Найдите [@BotFather](https://t.me/botfather) в Telegram
2. Отправьте команду `/newbot`
3. Следуйте инструкциям, чтобы создать бота
4. Получите Bot Token
5. Настройте Web App:
   - Отправьте `/setmenubutton` BotFather
   - Выберите своего бота
   - Введите название кнопки (например, "Play F1 🏎️")
   - Введите URL вашего приложения

## Установка с Docker (Рекомендуется)

1. Клонируйте репозиторий:
```bash
git clone <repository-url>
cd f1champ-tg-game
```

2. Создайте файл `.env` в корне проекта:
```bash
TELEGRAM_BOT_TOKEN=your_bot_token_here
```

3. Запустите все сервисы:
```bash
docker-compose up
```

4. Инициализируйте базу данных (в другом терминале):
```bash
docker-compose exec backend npm run init-db
```

Приложение будет доступно:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- PostgreSQL: localhost:5432

## Ручная установка

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка PostgreSQL

Создайте базу данных:
```sql
CREATE DATABASE f1champ;
```

### 3. Настройка Backend

Скопируйте `.env.example` в `.env`:
```bash
cd backend
cp .env.example .env
```

Отредактируйте `backend/.env`:
```
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/f1champ
TELEGRAM_BOT_TOKEN=your_bot_token_here
```

Инициализируйте базу данных:
```bash
# Создайте таблицы
psql -U postgres -d f1champ -f backend/src/db/schema.sql

# Заполните начальными данными
npm run dev:backend
# В другом терминале:
cd backend
npx ts-node src/db/seed.ts
```

### 4. Настройка Frontend

Скопируйте `.env.example` в `.env`:
```bash
cd frontend
cp .env.example .env
```

### 5. Запуск приложения

Запустите все сервисы:
```bash
# Из корня проекта
npm run dev
```

Или запустите отдельно:
```bash
# Backend
npm run dev:backend

# Frontend (в другом терминале)
npm run dev:frontend
```

## Настройка Telegram WebApp

1. Разместите frontend на публичном HTTPS-сервере (например, Vercel, Netlify)
2. Настройте backend API на публичном сервере с HTTPS
3. Обновите URL в BotFather:
   ```
   /setmenubutton
   <выберите бота>
   URL: https://your-frontend-url.com
   ```

## Тестирование локально

Для тестирования локально можно использовать ngrok:

1. Установите [ngrok](https://ngrok.com/)
2. Запустите туннель для frontend:
   ```bash
   ngrok http 5173
   ```
3. Используйте полученный HTTPS URL в BotFather

## Автоматические гонки

Планировщик гонок запускается автоматически вместе с backend. Он:
- Проверяет каждый час, нужно ли провести гонку
- Создает новые гонки каждые 2 дня
- Следит за окончанием сезона

## Полезные команды

```bash
# Сборка проекта
npm run build

# Только backend
npm run build:backend

# Только frontend
npm run build:frontend

# Остановить Docker сервисы
docker-compose down

# Удалить данные базы
docker-compose down -v
```

## Структура проекта

```
f1champ-tg-game/
├── frontend/          # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── hooks/
│   └── package.json
├── backend/           # Node.js + Express + PostgreSQL
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── routes/
│   │   ├── db/
│   │   └── middleware/
│   └── package.json
├── shared/            # Общие типы
│   └── src/
└── package.json       # Workspace root
```

## Troubleshooting

### Ошибка подключения к базе данных

Убедитесь, что PostgreSQL запущен и параметры подключения верны в `backend/.env`.

### Frontend не может подключиться к backend

Проверьте, что backend запущен на порту 3000 и CORS настроен правильно.

### Ошибки Telegram WebApp

Убедитесь, что:
1. Bot Token настроен правильно
2. WebApp URL настроен в BotFather
3. URL использует HTTPS (для production)
