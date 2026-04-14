# Fridge — аудит

## 1. Текущее состояние

Холодильник — список ингредиентов пользователя. Для FAMILY-группы — общий.

**Модель FridgeItem:** `userId`, `ingredientId`, `groupId?`, `quantityValue?`, `quantityUnit?`.

**Уникальность:**
- Семейный: `(groupId, ingredientId)` — один ингредиент на группу
- Личный: `(userId, ingredientId, groupId=null)`

**API `GET /fridge`** возвращает `{ items, familyGroupId }`.

**Хелпер `getFamilyGroupId(userId)`** — определяет к какой FAMILY группе принадлежит пользователь.

**Миграция:** при вступлении в FAMILY — личные FridgeItems переходят в семейный (groupId проставляется). При выходе — возвращаются (groupId=null).

**Фильтрация блюд:** эксклюзивный режим ("из холодильника") — нужны все ингредиенты, кроме `toTaste=true` и `isBasic=true`.

## 2. Найденные проблемы

| Проблема | Приоритет |
|---|---|
| Старый `@@unique([userId, ingredientId])` не учитывал groupId | critical |
| Миграция FridgeItems при join/leave не была транзакционной | critical |
| GET /fridge не возвращал familyGroupId — фронт не знал, общий ли холодильник | high |

## 3. Решения

- Убрать старый unique constraint, добавить два отдельных (семейный + личный)
- Миграция в `prisma.$transaction` (в groups.js)
- GET /fridge возвращает `{ items, familyGroupId }` — фронт показывает "Общий с семьёй"

## 4. Реализация

**Файлы:**
- `backend/src/routes/fridge.js` — GET/POST/DELETE/bulk/clear
- `backend/prisma/schema.prisma` — FridgeItem без старого unique

**Фронтенд:**
- `frontend/src/pages/FridgePage.jsx` — показывает "Семейный холодильник · Общий с семьёй" если `familyGroupId` не null
- `frontend/src/store/index.js` — `fridge` в Zustand-сторе, используется в `HomePage` для фильтрации

## 5. Открытые вопросы

- Напоминание о продуктах с истекающим сроком хранения (в бэклоге)
- Распознавание чека/фото холодильника (Pro-фича, в бэклоге)

## 6. Договорённости

- `getFamilyGroupId(userId)` — единственный способ получить ID семейной группы, не дублировать логику
- Миграция FridgeItems — всегда в транзакции, никогда по одному
- GET /fridge всегда возвращает `familyGroupId` — фронт обязан его использовать
