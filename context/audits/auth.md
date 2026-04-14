# Auth — аудит

## 1. Текущее состояние

JWT-авторизация. Три метода входа: email/пароль, Google OAuth, SMS.

**Ключевые особенности:**
- Token versioning (`tokenVersion` в БД) — server-side инвалидация токенов
- `authMiddleware` — требует JWT, 401 если нет
- `optionalAuth` — не блокирует, пишет userId если токен есть (для гостей)
- `requireRole('ADMIN')` — после authMiddleware
- Google OAuth: auto-link к существующему email-аккаунту
- SMS: код подтверждения через Resend
- Email: код подтверждения через Resend
- Telegram-авторизация: one-time token (10 мин) через бот → JWT

## 2. Найденные проблемы

| Проблема | Приоритет |
|---|---|
| Нет rate limit на login endpoint | critical |
| Google OAuth не проверял совпадение email при auto-link | high |
| Транзакционность при регистрации не гарантировалась | high |
| Telegram-link токены не чистились при старте | medium |

## 3. Решения

- Добавить `loginLimiter` (5 попыток/15 мин по IP)
- Google auto-link: проверять email строго
- Регистрация в транзакции Prisma
- Автоочистка просроченных `pendingTelegramLink` при старте бота

## 4. Реализация

Выполнено в аудите (коммит `c1f9167`):
- `loginLimiter` подключён на `POST /auth/login`
- Google flow проверяет email до merge
- `prisma.$transaction` в регистрации
- Telegram-бот чистит токены в `bot.start()`

**Файлы:**
- `backend/src/routes/auth.js` — основная логика
- `backend/src/middleware/auth.js` — authMiddleware, optionalAuth, requireRole
- `telegram/bot.js` — очистка токенов

## 5. Открытые вопросы

- "Войти через Telegram" на AuthPage (не кнопка бота, а полноценный flow) — требует доработки с мёржем аккаунтов

## 6. Договорённости

- `authMiddleware` и `optionalAuth` — только из `backend/src/middleware/auth.js`, не переопределять
- Новые auth-методы — через транзакцию
- Rate limit — на всех write-эндпоинтах авторизации
- Token versioning — не удалять, используется для server-side logout
