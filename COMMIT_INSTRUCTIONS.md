# Коммит: FridgePageV2

Ветка: `redesign`

## Что сделано

- Портирован артефакт `context/design/fridge-v2.jsx` в `frontend/src/pages/FridgePageV2.jsx`.
- Добавлен роут `/v2/fridge` в `frontend/src/App.jsx`.
- Сборка проходит (1855 модулей без ошибок).

Состояния: guest / пустой холодильник / рабочий вид + picker-modal (grouped chips + search).
Подключено к реальным API (`getFridge`, `getIngredients`, `bulkAddFridge`, `updateFridgeItem`, `removeFromFridge`, `clearFridge`, `generateTelegramLink`, `getTelegramLinkStatus`) и store (`fridge`, `setFridge`, `addToFridge`, `removeFromFridge`, `updateFridgeItem`).

Токены через Tailwind (`bg-accent`, `text-sage`, `bg-sage-muted`, `border-accent-border` и т.д.) — в тон к HomePageV2 / DishDetailPageV2.

## Команды

```bash
cd <путь-к-mealbot>
git status           # ожидаются: новый FridgePageV2.jsx + изменения App.jsx + COMMIT_INSTRUCTIONS.md
git branch --show-current   # должна быть redesign

git add frontend/src/pages/FridgePageV2.jsx \
        frontend/src/App.jsx \
        COMMIT_INSTRUCTIONS.md

git commit -m "feat(v2): FridgePageV2 + роут /v2/fridge

- портирован context/design/fridge-v2.jsx в pages/FridgePageV2.jsx
- три состояния: guest / пустой / рабочий + picker-modal
- реальные API (fridge, ingredients, telegram) и store
- токены через Tailwind (bg-accent, text-sage, border-border)"

git push origin redesign
```

## На сервере

```bash
cd <путь-к-mealbot>
git checkout redesign
git pull
cd frontend && npm run build
# backend не трогаем — правок там нет
```

## Проверить после деплоя

- `https://<host>/v2/fridge` без логина → GuestBlock
- логин → если фридж пуст, показывается Empty с кнопкой «Добавить продукты»
- Telegram-баннер (если не подключён) с крестиком-закрыть и «Подключить» (polling 180с)
- добавить пару продуктов через picker (chips по категориям / поиск) → должны появиться карточки
- тап по имени продукта → инлайн-редактор количества (qty + unit)
- тап по ✕ → удаление
- «Что можно приготовить?» → переход в `/chat?prompt=...`
- «Очистить всё» → confirm → Empty
- Family-баннер — если включена общая семейная группа
