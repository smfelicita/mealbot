# Коммит: difficulty фильтр на бэкенде

Ветка: `main`

## Что сделано

В `backend/src/routes/dishes.js` добавлена поддержка `?difficulty=easy|medium|hard` в `GET /api/dishes`. На фронте (`DishesPage.jsx`) убран клиентский filter — `difficulty` теперь идёт как обычный server-параметр.

Зачем: раньше клиент фильтровал в js после fetch — это ломало paging (подгружали страницу 2, половина опять отсеивалась) и `total` не совпадал с реально показанным.

## Что в working copy

```
modified:   backend/src/routes/dishes.js   (3 точки: комментарий, деструктуризация, buildBaseFilter)
modified:   frontend/src/pages/DishesPage.jsx  (убран клиентский filter, difficulty в getParams)
modified:   COMMIT_INSTRUCTIONS.md
```

Сборка проходит (фронт 1851 модулей, бэк синтаксис ок).

## Команды

```bash
cd <путь-к-mealbot>
git status                    # ожидаются: dishes.js + DishesPage.jsx + COMMIT_INSTRUCTIONS.md
git branch --show-current     # должна быть main

git add backend/src/routes/dishes.js \
        frontend/src/pages/DishesPage.jsx \
        COMMIT_INSTRUCTIONS.md

git commit -m "fix(api): фильтр по difficulty в GET /api/dishes

Раньше клиент DishesPage фильтровал difficulty в js после fetch —
это ломало paging (подгружали страницу 2, половина отсеивалась)
и total не совпадал. Добавлен прямой Prisma-фильтр where.difficulty
+ DishesPage передаёт difficulty как server-параметр."

git push origin main
```

## На сервере

```bash
ssh root@194.87.130.215 "cd /var/www/mealbot && git checkout main && git pull && pm2 restart mealbot-backend && cd frontend && npm run build 2>&1 | tail -10"
```

Здесь нужен **и backend restart, и frontend rebuild** (правки в обоих).

## Что проверить после деплоя

- `/dishes` → bottom-sheet фильтров → секция «Сложность» («Легко» / «Средне» / «Сложно»)
- выбрать «Легко» → счётчик `total` сверху корректный (в выдаче только лёгкие, paging работает чисто)
- скролл вниз — догружаются только подходящие
- сбросить — список возвращается полностью
- network tab: `GET /api/dishes?...&difficulty=easy` (раньше параметр уходил, но игнорировался)
