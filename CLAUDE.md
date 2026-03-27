# MealBot — инструкции для Claude Code

## Проект
Сервис выбора блюд с ИИ-помощником.
Стек: Node.js + Express + Prisma + PostgreSQL (Supabase) + React + Telegram-бот.

## Структура
```
backend/          — Express API (порт 3001)
  src/
    routes/       — auth, dishes, fridge, groups, chat, ingredients, upload
    middleware/   — auth.js (authMiddleware, optionalAuth, requireRole)
    lib/
      prisma.js   — ЕДИНЫЙ PrismaClient (singleton, все роуты импортируют отсюда)
      supabase.js — Supabase Storage клиент
    prisma/
      schema.prisma
      seed.js
frontend/         — React + Vite + PWA
  src/
    pages/        — ChatPage, DishesPage, FridgePage, GroupsPage, ...
    components/   — DishCard, Layout, DishModal
    api/index.js  — все API-вызовы
    store/index.js — Zustand store (user, token, fridge, chatMessages)
telegram/         — Telegram-бот
context/          — документация проекта (TASKS.md, FUNCTIONAL_SPEC.md)
```

## Деплой (VPS 194.87.130.215)
- Backend: PM2, `pm2 restart mealbot-backend`
- Frontend: `cd frontend && npm run build` (статика через nginx)
- Логи: `pm2 logs mealbot-backend --lines 30`
- После `git pull` на сервере: `pm2 restart mealbot-backend && cd frontend && npm run build`

## Важные правила

### БД (Supabase)
- DATABASE_URL должен быть на порту **5432** (Session Pooler), НЕ 6543 (Transaction Pooler вызывает ошибку 42P05)
- `prisma db push` использует DIRECT_URL (тоже порт 5432)
- Seed: `DATABASE_URL="...5432..." npm run db:seed`

### PrismaClient
- Всегда импортировать из `../lib/prisma`, никогда не создавать `new PrismaClient()` в роутах

### Авторизация
- `authMiddleware` — требует JWT, возвращает 401 если нет
- `optionalAuth` — не блокирует, но кладёт userId если токен есть (для гостей)
- `requireRole('ADMIN')` — использовать после authMiddleware

### Гости (Этап 5)
- ИИ-чат: лимит 5 сообщений/день по IP (in-memory счётчик в chat.js)
- Холодильник: FridgePage показывает блок-заглушку если нет token
- AuthPage: принимает ?mode=register для открытия нужной вкладки

### Видимость рецептов (Dish.visibility)
- PUBLIC — все
- PRIVATE — только автор
- FAMILY — участники семейной группы (по groupId)
- ALL_GROUPS — соучастники любой группы автора

## Текущий статус
Смотри context/TASKS.md — там актуальный список выполненного и бэклог.
