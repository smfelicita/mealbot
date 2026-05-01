# Коммит: DishesPageV2

Ветка: `redesign`

## Что сделано

- Портирован артефакт `context/design/dishes-v2.jsx` в `frontend/src/pages/DishesPageV2.jsx`.
- Добавлен роут `/v2/dishes` в `frontend/src/App.jsx` (перед `/v2/dishes/:id`).
- Сборка проходит без ошибок.

Состояния: initial / search / filters-открыты / empty-states (4 варианта — гость / своя пустая кухня / поиск ничего не нашёл / отфильтровано).

Подключено:
- `api.getDishes` с paging (`limit=20`, `offset`, `IntersectionObserver`)
- `api.getFavoriteIds` / `addFavorite` / `removeFavorite`
- `api.addMealPlan` (кнопка `+` в карточке)
- `store.fridge` для расчёта «есть в холодильнике / не хватает N»
- `BulkAddModal` (через крошечный hint-баннер «через запятую»)
- Поиск с debounce 300мс
- Фильтры: `mealTime` (chips сверху), `fridgeMode`, `favorites`, `tags` (множественный), `cuisine` (один — backend поддерживает), `difficulty` (клиентский filter)
- FAB → `/dishes/new` (форма пока старая)
- Тап по карточке → `/v2/dishes/:id`

Токены через Tailwind (`bg-accent`, `text-sage`, `bg-sage-muted`, `border-accent-border`) — в тон HomePageV2 / FridgePageV2 / DishDetailPageV2.

## Команды

```bash
cd <путь-к-mealbot>
git status                    # ожидаются: новый DishesPageV2.jsx + App.jsx + COMMIT_INSTRUCTIONS.md + dishes-v2.jsx (артефакт)
git branch --show-current     # должна быть redesign

git add frontend/src/pages/DishesPageV2.jsx \
        frontend/src/App.jsx \
        context/design/dishes-v2.jsx \
        COMMIT_INSTRUCTIONS.md

git commit -m "feat(v2): DishesPageV2 + роут /v2/dishes

- портирован context/design/dishes-v2.jsx в pages/DishesPageV2.jsx
- состояния: initial / search / filters / empty (гость / своя кухня / отфильтровано)
- IntersectionObserver paging, debounce поиска
- фильтры: mealTime, холодильник, избранное, теги, кухня, сложность (клиентски)
- BulkAddModal через hint-баннер
- FAB → /dishes/new, тап карточки → /v2/dishes/:id"

git push origin redesign
```

## На сервере

```bash
cd <путь-к-mealbot>
git checkout redesign
git pull
cd frontend && npm run build
# backend не трогаем
```

## Проверить после деплоя

- `https://<host>/v2/dishes` без логина → empty с CTA «Создать свою кухню»
- логин + пустая кухня → empty с «Добавить блюдо»
- ввод в поиск → debounce 300мс, fetch только после паузы
- mealtime-чипы (Все/Завтрак/Обед/Ужин/Перекус) → переключается серверный фильтр
- «Холодильник» → sage-tint, серверный `fridgeMode=true`
- «Избранное» → accent-tint, серверный `favorites=true`
- кнопка фильтров (SlidersHorizontal) → bottom-sheet с тегами/кухней/сложностью + sage-точкой когда активны
- скролл к низу списка → подгрузка следующей страницы (200px rootMargin)
- сердечко на карточке → optimistic toggle избранного
- `+` → добавить в план на сегодня (toast)
- тап карточки → переход на `/v2/dishes/:id`
- крошечный hint про запятую (только если есть блюда и не закрыт ранее) → клик → BulkAddModal
- FAB «Добавить блюдо» → `/dishes/new`
