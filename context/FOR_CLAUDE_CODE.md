# Инструкция для Claude Code

Привет! Ты продолжаешь работу над проектом MealBot.
Прочитай файлы в `context/` чтобы войти в курс дела.

## С чего начать

1. Прочитай `CHAT_SUMMARY.md` — история, текущий статус, деплой
2. Прочитай `TASKS.md` — что сделано и что осталось
3. Прочитай `ERRORS.md` — все ошибки которые уже были решены
4. Прочитай `ENV_TEMPLATE.md` — что нужно в .env файлах

## Стек и структура

- **Backend:** Node.js + Express + Prisma + PostgreSQL (Supabase), порт 3001
- **Frontend:** React + Vite + PWA (тёмная тема)
- **Telegram-бот:** node-telegram-bot-api
- **Деплой:** VPS Timeweb, nginx + PM2, домен smarussya.ru

```
backend/src/
  routes/    — auth, dishes, fridge, groups, chat, ingredients, upload
  middleware/— auth.js (authMiddleware, optionalAuth, requireRole)
  lib/       — prisma.js (singleton!), supabase.js
frontend/src/
  pages/     — ChatPage, DishesPage, FridgePage, GroupsPage, AuthPage, ...
  components/— DishCard, Layout, DishModal
  api/index.js
  store/index.js — Zustand
```

## Важные правила

### БД
- DATABASE_URL: Session Pooler, порт **5432** (НЕ 6543 Transaction Pooler!)
- `prisma db push` использует DIRECT_URL (тоже 5432)
- Seed: `DATABASE_URL="...5432..." npm run db:seed`
- `prisma migrate dev` не работает в non-interactive среде → использовать `prisma db push --accept-data-loss`

### PrismaClient
- Всегда импортировать из `../lib/prisma`, никогда не создавать `new PrismaClient()` в роутах

### Код
- `useToast` должен быть с расширением `.jsx` (не `.js`)
- seed.js использует `findFirst` + `create` (не `upsert`) для блюд
- `.env` файлы НЕ в git

### Валидация (Zod)
- Схемы — в `backend/src/lib/schemas.js`
- Middleware — `backend/src/middleware/validate.js`
- Подключение: `router.post('/', validate(schemaName), handler)`
- Все write-эндпоинты должны иметь Zod-схему

### Логирование
- `const { logger } = require('../lib/logger')` — импорт в роутах
- `logger.info({ action: 'event_name', ...поля, requestId: req.requestId }, 'event_name')`
- Никогда не логировать: пароли, JWT, коды, email целиком (маскировать через maskEmail)

### Авторизация
- `authMiddleware` — требует JWT, 401 если нет
- `optionalAuth` — не блокирует, кладёт userId если токен есть
- `requireRole('ADMIN')` — после authMiddleware

### Email
- Отправка через Resend (пакет `resend`)
- Если `RESEND_API_KEY` не задан — fallback на console.log (заглушка)
- Домен smarussya.ru нужно верифицировать в Resend для отправки на любые адреса

## Пользователь

Марина — middle PHP/WordPress разработчик, новичок в Node.js/React.
Объясняй просто, пошагово. Команды давай по одной.
