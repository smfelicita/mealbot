# Ошибки и решения

## ❌ Ошибка 1 — seed.js: PrismaClientValidationError upsert

**Файл:** `backend/src/prisma/seed.js`
**Ошибка:**
```
PrismaClientValidationError: Argument `where` of type DishWhereUniqueInput needs
at least one of `id` arguments.
```
**Причина:** Поле `name` у модели `Dish` не `@unique` — Prisma не принимает его в `where` для `upsert`.

**Решение:** Заменить `upsert` на `findFirst` + `create`.

**Статус:** ✅ Исправлено

---

## ❌ Ошибка 2 — JSX в .js файле

**Файл:** `frontend/src/hooks/useToast.js`
**Ошибка:**
```
✘ [ERROR] The JSX syntax extension is not currently enabled
```
**Решение:** Переименовать в `useToast.jsx`.

**Статус:** ✅ Исправлено

---

## ❌ Ошибка 3 — GitHub: секрет в коммите

**Ошибка:** `GITHUB PUSH PROTECTION — Push cannot contain secrets`

**Решение:**
```bash
git rm --cached backend/.env
git checkout --orphan fresh && git add . && git commit -m "Initial commit"
git branch -D main && git branch -m main && git push origin main --force
```
Пересоздать Anthropic API-ключ — старый скомпрометирован!

**Статус:** ✅ Исправлено

---

## ❌ Ошибка 4 — Supabase: Can't reach database / prepared statement 42P05

**Ошибки:**
```
Can't reach database server at db.xxx.supabase.co:5432
prepared statement "s0" already exists (42P05)
```
**Причина:** Прямое подключение (5432) блокируется; Transaction Pooler (6543) вызывает 42P05.

**Решение:** Использовать **Session Pooler**, порт **5432**:
```
postgresql://postgres.PROJECT_ID:ПАРОЛЬ@aws-1-eu-west-2.pooler.supabase.com:5432/postgres
```

**Статус:** ✅ Исправлено — используем Session Pooler 5432

---

## ❌ Ошибка 5 — prisma db push зависает на интерактивном вопросе

**Ошибка:** Команда зависает на `Do you want to ignore the warnings?` и крашится с TypeError.

**Решение:** Добавить флаг:
```bash
npx prisma db push --accept-data-loss
```

**Статус:** ✅ Исправлено

---

## ❌ Ошибка 6 — git pull падает из-за package-lock.json

**Ошибка:**
```
error: Your local changes to the following files would be overwritten by merge:
node_modules/.package-lock.json
```
**Причина:** Запуск `npm install` на сервере изменил lock-файл до `git pull`.

**Решение:**
```bash
git checkout package-lock.json && git pull
```

**Статус:** ✅ Исправлено

---

## ❌ Ошибка 8 — CORS rejected: "Not allowed by CORS" при Google OAuth

**Ошибка в pm2 logs:**
```
cors_rejected origin: https://smarussya.ru
Error: Not allowed by CORS
```

**Причина:** `FRONTEND_URL` в backend/.env был задан как IP-адрес `http://194.87.130.215`, но браузер делает запросы с домена `https://smarussya.ru`. CORS-функция делает строгое `===` сравнение.

**Решение:** Обновить `.env` на сервере:
```
FRONTEND_URL=https://smarussya.ru
```
Затем: `pm2 restart mealbot-backend`

**Статус:** ✅ Исправлено

---

## ❌ Ошибка 9 — Backend не стартует после деплоя (Cannot find module 'pino')

**Ошибка:**
```
Error: Cannot find module 'pino'
```

**Причина:** После `git pull` не был запущен `npm install`, новый пакет `pino` отсутствовал на сервере.

**Решение:**
```bash
cd /var/www/mealbot/backend && npm install && pm2 restart mealbot-backend
```

**Статус:** ✅ Исправлено — после каждого `git pull` нужно запускать `npm install`

---

## ❌ Ошибка 7 — Google OAuth не принимает IP-адрес

**Ошибка:** `Invalid Origin: must end with a public top-level domain`

**Причина:** Google OAuth не принимает IP-адреса в Authorized JavaScript origins.

**Решение:** Нужен домен. Марина купила `smarussya.ru`, настроила A-запись → 194.87.130.215.

**Статус:** ✅ Исправлено — используем https://smarussya.ru
