# 🍽️ MealBot — умный помощник для выбора блюд

## Структура проекта
```
mealbot/
├── backend/          — Node.js + Express + Prisma API
├── frontend/         — React + Vite (PWA)
└── telegram-bot/     — Telegram-бот
```

## Быстрый старт

### 1. База данных
Создай PostgreSQL базу на [Railway](https://railway.app) или [Supabase](https://supabase.com) (бесплатно).

### 2. Бэкенд
```bash
cd backend
cp .env.example .env
# Заполни .env: DATABASE_URL, JWT_SECRET, ANTHROPIC_API_KEY

npm install
npx prisma generate
npx prisma migrate dev --name init
node src/prisma/seed.js    # загружает 20 блюд и 37 продуктов
npm run dev
```

### 3. Фронтенд
```bash
cd frontend
npm install
npm run dev
# Открой http://localhost:5173
```

### 4. Telegram-бот
```bash
# 1. Создай бота через @BotFather → скопируй токен
cd telegram-bot
cp .env.example .env
# Заполни: TELEGRAM_BOT_TOKEN, DATABASE_URL, ANTHROPIC_API_KEY
npm install
npm start
```

## Деплой на Railway

1. Залей проект на GitHub
2. Создай проект на [railway.app](https://railway.app)
3. Добавь PostgreSQL plugin
4. Создай 3 сервиса: backend, frontend, telegram-bot
5. Для каждого укажи `Root Directory` и переменные окружения
6. Backend автоматически запустит seed при первом деплое

## Хостинг — варианты
| Сервис | Что | Цена |
|--------|-----|------|
| [Railway](https://railway.app) | Backend + Bot | $5/мес (hobby) |
| [Render](https://render.com) | Backend + Bot | Бесплатно (засыпает) |
| [Vercel](https://vercel.com) | Frontend | Бесплатно |
| [Supabase](https://supabase.com) | PostgreSQL | Бесплатно |

## Возможности
- 🔍 Поиск блюд по названию, тегам, продуктам
- 🎛 Инклюзивная фильтрация (хотя бы один продукт совпадает)
- 🧊 Режим холодильника — только блюда из имеющихся продуктов
- ✨ ИИ-помощник на базе Claude API
- 📱 PWA — работает как мобильное приложение
- 🤖 Telegram-бот с полным функционалом
