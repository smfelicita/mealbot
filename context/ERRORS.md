# Ошибки и решения

## ❌ Ошибка 1 — seed.js: PrismaClientValidationError upsert

**Файл:** `backend/src/prisma/seed.js`
**Ошибка:**
```
PrismaClientValidationError: Argument `where` of type DishWhereUniqueInput needs
at least one of `id` arguments.
```
**Причина:** В схеме поле `name` у модели `Dish` не помечено как `@unique`,
поэтому Prisma не принимает его в `where` для `upsert`.

**Решение:** Заменить `upsert` на `findFirst` + `create`:
```js
// БЫЛО (неправильно):
const created = await prisma.dish.upsert({
  where: { name: dish.name },
  ...
})

// СТАЛО (правильно):
const existing = await prisma.dish.findFirst({ where: { name: dish.name } })
if (existing) {
  console.log(`  ⏭  ${dishData.nameRu} уже есть`)
  continue
}
const created = await prisma.dish.create({ data: { ...dishData, ... } })
```
**Статус:** ✅ Исправлено в seed.js (строки 328-343)

---

## ❌ Ошибка 2 — JSX в .js файле

**Файл:** `frontend/src/hooks/useToast.js`
**Ошибка:**
```
✘ [ERROR] The JSX syntax extension is not currently enabled
src/hooks/useToast.js:12:4
The esbuild loader for this file is currently set to "js" but it must be set to "jsx"
```
**Причина:** Файл содержит JSX (React компоненты) но имеет расширение `.js`

**Решение:** Переименовать файл в `useToast.jsx` и обновить импорт в FridgePage:
```js
// В FridgePage.jsx:
import { useToast } from '../hooks/useToast.jsx'
```
**Статус:** ✅ Исправлено

---

## ❌ Ошибка 3 — useToast.jsx не найден

**Файл:** `frontend/src/pages/FridgePage.jsx`
**Ошибка:**
```
Failed to resolve import "../hooks/useToast.jsx" from "src/pages/FridgePage.jsx".
Does the file exist?
```
**Причина:** Файл `useToast.jsx` не был создан в нужной папке (скачанный файл
не переместили руками)

**Решение:** Создать файл через терминал:
```bash
cat > src/hooks/useToast.jsx << 'EOF'
import { useState, useCallback } from 'react'
export function useToast() {
  const [toast, setToast] = useState(null)
  const show = useCallback((message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 2500)
  }, [])
  const Toast = toast ? (
    <div className={`toast ${toast.type}`}>{toast.message}</div>
  ) : null
  return { show, Toast }
}
EOF
```
**Статус:** ✅ Исправлено

---

## ❌ Ошибка 4 — GitHub: секрет в коммите

**Ошибка:**
```
remote: - GITHUB PUSH PROTECTION
remote: Push cannot contain secrets
remote: —— Anthropic API Key ————
path: backend/.env:3
```
**Причина:** Файл `backend/.env` с API-ключом был закоммичен в git

**Решение:**
1. Удалить файл из отслеживания: `git rm --cached backend/.env`
2. Убедиться что `.env` в `.gitignore`
3. Пересоздать историю без старых коммитов:
```bash
git checkout --orphan fresh
git add .
git commit -m "Initial commit"
git branch -D main
git branch -m main
git push origin main --force
```
4. ⚠️ Создать новый Anthropic API-ключ — старый скомпрометирован!

**Статус:** ✅ Исправлено

---

## ❌ Ошибка 5 — EADDRINUSE порт 3001 занят

**Ошибка:**
```
Error: listen EADDRINUSE: address already in use :::3001
```
**Причина:** Предыдущий процесс не был остановлен (Ctrl+Z вместо Ctrl+C)

**Решение:**
```bash
kill $(lsof -t -i:3001)
```
**Статус:** ✅ Исправлено

---

## ❌ Ошибка 6 — Can't reach database server Supabase

**Ошибка:**
```
Can't reach database server at `db.nwtqeytmmqmkwqafkgin.supabase.co:5432`
```
**Причина:** Прямое подключение к Supabase на порту 5432 часто блокируется
провайдером / файрволом

**Решение:** Использовать Transaction Pooler вместо прямого подключения.
В Supabase: Project Settings → Database → Connection string → Transaction pooler
URL будет вида:
```
postgresql://postgres.PROJECT_ID:ПАРОЛЬ@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```
**Статус:** ✅ Исправлено пользователем самостоятельно

---

## ❌ Ошибка 7 — GitHub: Password authentication not supported

**Ошибка:**
```
remote: Invalid username or token. Password authentication is not supported
```
**Причина:** GitHub с 2021 года не принимает пароль для git push

**Решение:** Настроить SSH:
```bash
ssh-keygen -t ed25519 -C "email@example.com"
cat ~/.ssh/id_ed25519.pub  # скопировать и добавить на github.com/settings/ssh
ssh -T git@github.com      # проверить
git remote set-url origin git@github.com:USERNAME/mealbot.git
git push -u origin main
```
**Статус:** ✅ Исправлено
