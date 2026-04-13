# MealBot — Контекст проекта

## Что это за проект
Кроссплатформенный сервис для выбора блюд с ИИ-помощником.
Доступен как PWA (устанавливается на телефон) и Telegram-бот.

## Стек технологий
- **Бэкенд:** Node.js + Express + Prisma ORM + Zod (валидация)
- **База данных:** PostgreSQL (Supabase, Session Pooler порт 5432)
- **Фронтенд:** React + Vite + Tailwind CSS (PWA)
- **Telegram-бот:** node-telegram-bot-api
- **ИИ:** Claude API (Anthropic)
- **Хостинг:** VPS Timeweb (IP 194.87.130.215), nginx + PM2
- **Домен:** https://smarussya.ru
- **Медиафайлы:** Supabase Storage

## Структура проекта
```
mealbot/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── index.js               ← Express сервер (порт 3001)
│   │   ├── middleware/
│   │   │   ├── auth.js            ← authMiddleware, optionalAuth, requireRole
│   │   │   ├── validate.js        ← Zod-валидация (validate(schema))
│   │   │   └── errorHandler.js    ← единый обработчик ошибок
│   │   ├── lib/
│   │   │   ├── prisma.js          ← ЕДИНЫЙ PrismaClient singleton
│   │   │   ├── supabase.js        ← Supabase Storage клиент
│   │   │   ├── schemas.js         ← все Zod-схемы (groups, dishes, auth, fridge, meal-plans, comments)
│   │   │   ├── logger.js          ← pino logger
│   │   │   ├── nutrition.js       ← расчёт КБЖУ
│   │   │   ├── messageFilter.js   ← blocklist для ИИ-чата
│   │   │   └── fridgeMigration.js ← миграция холодильника при вступлении в FAMILY
│   │   └── routes/
│   │       ├── auth.js            ← /api/auth (register, login, google, tg, me)
│   │       ├── dishes.js          ← /api/dishes (поиск, фильтрация, пагинация)
│   │       ├── fridge.js          ← /api/fridge
│   │       ├── chat.js            ← /api/chat (ИИ-помощник)
│   │       ├── groups.js          ← /api/groups
│   │       ├── invites.js         ← /api/invites
│   │       ├── ingredients.js     ← /api/ingredients
│   │       ├── comments.js        ← /api/comments
│   │       ├── meal-plans.js      ← /api/meal-plans
│   │       └── upload.js          ← /api/upload
│   └── package.json
│
├── frontend/
│   └── src/
│       ├── App.jsx                ← роутер + ErrorBoundary
│       ├── api/index.js           ← все запросы к бэкенду
│       ├── store/index.js         ← Zustand (user, token, fridge, chatMessages)
│       ├── components/
│       │   ├── ui/                ← Button, TextInput, SearchInput, Modal...
│       │   └── domain/            ← RecipeList, DishCard, MealTypeChips...
│       └── pages/
│           ├── AuthPage.jsx
│           ├── HomePage.jsx
│           ├── DishesPage.jsx     ← infinite scroll (20 блюд / порция)
│           ├── DishDetailPage.jsx
│           ├── FridgePage.jsx
│           ├── ChatPage.jsx
│           ├── GroupsPage.jsx
│           ├── GroupDetailPage.jsx
│           ├── MealPlanPage.jsx
│           └── ProfilePage.jsx
│
├── telegram/                      ← Telegram-бот
│
└── context/                       ← документация проекта
    ├── README.md                  ← этот файл
    ├── TASKS.md                   ← задачи и статус
    ├── ERRORS.md                  ← ошибки и решения
    ├── CHAT_SUMMARY.md            ← история проекта
    ├── ENV_TEMPLATE.md            ← шаблоны .env файлов
    ├── FUNCTIONAL_SPEC.md         ← функциональная спецификация
    ├── PRODUCT.md                 ← продуктовый документ
    ├── FOR_CLAUDE_CODE.md         ← инструкция для Claude Code
    ├── FRONTEND_STANDARDS.md      ← стандарты фронтенда
    └── COMPONENTS.md              ← карта компонентов
```

## Деплой (команды на сервере)
```bash
# После git pull:
cd /var/www/mealbot/backend && npm install
pm2 restart mealbot-backend

# Если изменился фронтенд:
cd /var/www/mealbot/frontend && npm run build

# Если изменилась схема БД:
cd /var/www/mealbot/backend && npx prisma db push
```
