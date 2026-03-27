# MealBot — Контекст проекта

## Что это за проект
Кроссплатформенный сервис для выбора блюд на завтрак/обед/ужин с ИИ-помощником.

## Стек технологий
- **Бэкенд:** Node.js + Express + Prisma ORM
- **База данных:** PostgreSQL (Supabase — бесплатный хостинг)
- **Фронтенд:** React + Vite (PWA — работает как мобильное приложение)
- **Telegram-бот:** node-telegram-bot-api
- **ИИ:** Claude API (Anthropic) — claude-opus-4-5
- **Хостинг бэкенда:** Railway
- **Хостинг фронтенда:** Vercel

## Структура проекта
```
mealbot/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          ← схема БД
│   ├── src/
│   │   ├── index.js               ← Express сервер (порт 3001)
│   │   ├── middleware/
│   │   │   └── auth.js            ← JWT авторизация
│   │   ├── routes/
│   │   │   ├── auth.js            ← /api/auth (register, login, me)
│   │   │   ├── dishes.js          ← /api/dishes (поиск + фильтрация)
│   │   │   ├── fridge.js          ← /api/fridge (холодильник)
│   │   │   ├── chat.js            ← /api/chat (ИИ-помощник)
│   │   │   └── ingredients.js     ← /api/ingredients
│   │   ├── prisma/
│   │   │   ├── seed.js            ← загрузка данных (ИСПРАВЛЕН — см. ошибки)
│   │   │   └── seed_fix.js        ← альтернативный seed если основной не работает
│   │   └── startup.js             ← для первого деплоя на Railway
│   ├── .env                       ← ЛОКАЛЬНЫЙ (не в git!)
│   ├── .env.example               ← шаблон для .env
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                ← роутер (react-router-dom)
│   │   ├── main.jsx               ← точка входа
│   │   ├── styles.css             ← все стили (dark theme)
│   │   ├── api/
│   │   │   └── index.js           ← все запросы к бэкенду
│   │   ├── store/
│   │   │   └── index.js           ← Zustand стор (auth, fridge, chat)
│   │   ├── components/
│   │   │   └── Layout.jsx         ← нижняя навигация
│   │   ├── hooks/
│   │   │   └── useToast.jsx       ← уведомления (ВАЖНО: .jsx не .js!)
│   │   └── pages/
│   │       ├── AuthPage.jsx       ← вход / регистрация
│   │       ├── HomePage.jsx       ← главная с фильтром по времени дня
│   │       ├── DishesPage.jsx     ← каталог + поиск + фильтры
│   │       ├── DishDetailPage.jsx ← рецепт блюда
│   │       ├── FridgePage.jsx     ← управление холодильником
│   │       └── ChatPage.jsx       ← ИИ-чат
│   ├── public/
│   │   └── manifest.json          ← PWA манифест
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── telegram-bot/
│   ├── src/
│   │   └── index.js               ← полный бот (меню, холодильник, ИИ)
│   ├── .env                       ← ЛОКАЛЬНЫЙ (не в git!)
│   ├── .env.example
│   └── package.json
│
├── context/                       ← ЭТА ПАПКА — контекст для ИИ
│   ├── README.md                  ← этот файл
│   ├── TASKS.md                   ← задачи и статус
│   ├── ERRORS.md                  ← все ошибки и решения
│   ├── CHAT_SUMMARY.md            ← краткое содержание диалога
│   └── ENV_TEMPLATE.md            ← что нужно заполнить в .env
│
└── README.md                      ← инструкция по запуску
