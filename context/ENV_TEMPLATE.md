# Что нужно заполнить в .env файлах

## backend/.env

```env
# 1. БД Supabase — Session Pooler, порт 5432 (НЕ 6543!)
DATABASE_URL="postgresql://postgres.PROJECT_ID:ПАРОЛЬ@aws-1-eu-west-2.pooler.supabase.com:5432/postgres"
DIRECT_URL="postgresql://postgres.PROJECT_ID:ПАРОЛЬ@aws-1-eu-west-2.pooler.supabase.com:5432/postgres"

# 2. JWT секрет (минимум 32 символа)
JWT_SECRET="любой_длинный_случайный_текст"

# 3. Anthropic API (ИИ-помощник)
ANTHROPIC_API_KEY="sk-ant-..."

# 4. URL фронтенда (для CORS)
FRONTEND_URL="https://smarussya.ru"

# 5. Порт
PORT=3001

# 6. Supabase Storage (загрузка фото/видео)
SUPABASE_URL="https://PROJECT_ID.supabase.co"
SUPABASE_SERVICE_KEY="eyJ..."   # service_role key (не anon!)

# 7. Telegram Bot
TELEGRAM_BOT_TOKEN="7123456789:AAH..."
TELEGRAM_WEBHOOK_URL="https://smarussya.ru/telegram/webhook"

# 8. Google OAuth
GOOGLE_CLIENT_ID="xxxxxxxxx.apps.googleusercontent.com"

# 9. Resend (отправка email)
RESEND_API_KEY="re_..."
RESEND_FROM="MealBot <noreply@smarussya.ru>"
```

## frontend/.env

```env
VITE_API_URL="https://smarussya.ru/api"
VITE_GOOGLE_CLIENT_ID="xxxxxxxxx.apps.googleusercontent.com"
```

## telegram-bot/.env

```env
TELEGRAM_BOT_TOKEN="7123456789:AAH..."
DATABASE_URL="postgresql://..."
ANTHROPIC_API_KEY="sk-ant-..."
API_URL="http://localhost:3001"
```

---

## Настройка Google OAuth (инструкция)

1. console.cloud.google.com → создать проект
2. APIs & Services → Credentials → Create → OAuth 2.0 Client ID
3. Application type: Web application
4. Authorized JavaScript origins:
   - `http://localhost:5173`
   - `https://smarussya.ru`
5. Скопировать Client ID → в backend/.env (GOOGLE_CLIENT_ID) и frontend/.env (VITE_GOOGLE_CLIENT_ID)
6. Пересобрать frontend после добавления VITE_GOOGLE_CLIENT_ID

## Настройка Resend (отправка email)

1. resend.com → зарегистрироваться
2. API Keys → Create API Key → скопировать в RESEND_API_KEY
3. Domains → Add Domain → `smarussya.ru` → добавить DNS-записи в Timeweb
4. После верификации домена письма будут отправляться с noreply@smarussya.ru
