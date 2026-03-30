# Краткое содержание диалога

## Кто делает проект
- **Пользователь:** Марина (marinasirota / smfelicita на GitHub)
- **Mac** (Air-Marina), зона Amsterdam
- **Опыт:** прикладной middle веб-разработчик — PHP, HTML, JS, CSS, 1C-Bitrix, WordPress
- **Новое для неё:** Node.js, React, Prisma, деплой на VPS, Linux

---

## История проекта

### Идея (что хотели)
Кроссплатформенный сервис для выбора блюд:
- Поиск по названию, продуктам, тегам
- Инклюзивная фильтрация (показать блюдо если хотя бы один продукт совпадает)
- Режим холодильника — эксклюзивная фильтрация (только если ВСЕ продукты есть)
- Холодильник заполняется через приложение или Telegram-бот
- ИИ-помощник который помогает выбрать блюдо в диалоге

### Что выбрали
- Приоритет: ИИ-помощник → Telegram-бот → веб-сайт → мобилка
- Стек: Node.js (не PHP — для нового проекта)
- Мобилка: PWA (не Flutter — проще для старта)
- Хостинг: VPS Timeweb (IP 194.87.130.215) + nginx + PM2

---

## Текущий статус (актуально)

### Деплой
- **Домен:** https://smarussya.ru (A-запись → 194.87.130.215)
- **HTTPS:** Let's Encrypt через certbot ✅
- **Backend:** PM2, порт 3001, nginx reverse proxy ✅
- **Frontend:** собранные статические файлы через nginx ✅
- **GitHub:** git@github.com:smfelicita/mealbot.git

### Реализованные функции
Смотри TASKS.md — там актуальный список

### Авторизация (реализовано)
- Email + пароль + подтверждение кода (отправка через Resend)
- Телефон + SMS-код (заглушка — код в логи PM2)
- Google OAuth (@react-oauth/google фронт + google-auth-library бэк)

### Что настроено на сервере
- `RESEND_API_KEY` — реальная отправка email через Resend
- `GOOGLE_CLIENT_ID` — Google OAuth
- `VITE_GOOGLE_CLIENT_ID` — в frontend/.env для сборки

---

## Важные детали

### Файлы которые НЕ должны быть в git
- `backend/.env` — все секреты бэкенда
- `frontend/.env` — VITE_* переменные
- `telegram-bot/.env` — токен бота

### Supabase проект
- Project ID: `nwtqeytmmqmkwqafkgin`
- Pooler URL: `aws-1-eu-west-2.pooler.supabase.com:5432` (Session Pooler!)
- ВАЖНО: использовать Session Pooler (порт 5432), НЕ Transaction Pooler (6543)

### GitHub
- Username: smfelicita
- Repo: `git@github.com:smfelicita/mealbot.git`
- Настроен SSH

### Деплой после изменений
```bash
# Локально:
git add -A && git commit -m "..." && git push

# На сервере:
cd /var/www/mealbot && git pull
cd backend && npm install
pm2 restart mealbot-backend
# Если изменился фронтенд:
cd ../frontend && npm run build
```
