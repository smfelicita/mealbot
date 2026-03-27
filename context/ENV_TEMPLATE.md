# Что нужно заполнить в .env файлах

## backend/.env

```env
# 1. Строка подключения к Supabase
# Брать из: supabase.com → Project Settings → Database → Transaction pooler → URI
# ВАЖНО: использовать Transaction Pooler (порт 6543), не прямое подключение (порт 5432)
DATABASE_URL="postgresql://postgres.PROJECT_ID:ПАРОЛЬ@aws-0-eu-central-1.pooler.supabase.com:6543/postgres"

# 2. Секрет для JWT токенов — любая случайная строка от 32 символов
# Сгенерировать: openssl rand -hex 32
JWT_SECRET="любой_длинный_случайный_текст_минимум_32_символа"

# 3. API ключ Anthropic для ИИ-помощника
# Взять из: console.anthropic.com → API Keys
# Начинается с sk-ant-
ANTHROPIC_API_KEY="sk-ant-api03-..."

# 4. URL фронтенда (для CORS)
# Локально:
FRONTEND_URL="http://localhost:5173"
# После деплоя на Vercel заменить на:
# FRONTEND_URL="https://mealbot.vercel.app"

# 5. Порт сервера (можно не менять)
PORT=3001
```

---

## telegram-bot/.env

```env
# 1. Токен бота от @BotFather в Telegram
TELEGRAM_BOT_TOKEN="7123456789:AAH..."

# 2. Та же строка что в backend/.env
DATABASE_URL="postgresql://..."

# 3. Тот же ключ что в backend/.env
ANTHROPIC_API_KEY="sk-ant-..."
```

---

## Переменные для Railway (деплой бэкенда)

Добавить в Railway → Variables:
- `DATABASE_URL` — строка Supabase (Transaction Pooler)
- `JWT_SECRET` — секрет
- `ANTHROPIC_API_KEY` — ключ Anthropic
- `FRONTEND_URL` — URL Vercel после деплоя
- `PORT` — 3001

## Переменные для Vercel (деплой фронтенда)

Добавить в Vercel → Environment Variables:
- `VITE_API_URL` — URL Railway бэкенда (например https://mealbot-production.up.railway.app)
