# Коммит: MealPlanPage редизайн

Ветка: `main`. Frontend-only.

## Что сделано

Полностью переписан `frontend/src/pages/MealPlanPage.jsx` под редизайн (артефакт `context/design/plan-v2.jsx`).

**Состояния:**
- **Гость** — `GuestBlock` с CTA «Создать свою кухню».
- **Пустой** (логин, но плана нет) — EmptyState с Icon `CalendarPlus`, кнопка «Посмотреть блюда» → `/dishes`.
- **Рабочий** — PageHeader (title + count·days в правом слоте) + (опц.) FilterChips + MetaStrip + (опц.) TodayPinned + (опц.) DayBlocks по будущим датам.

**Компоненты внутри страницы:**
- `FilterChips` — Все / Мои / Семейные. Показывается **только если есть план в семейной группе** (counts.family > 0).
- `MetaStrip` — три ячейки (Сегодня / Неделя / Всего). «Всего» становится sage-tint когда total ≥ 5.
- `TodayPinned` — accent-muted блок «Сегодня · понедельник, 20 апреля» с группировкой по mealType. Variant A (group-box) из артефакта.
- `DayBlock` — для каждой будущей даты: верхняя бирка с датой + группировка по mealType + список плановых строк.
- `PlanRow` — строка плана: 60×60 фото (с фолбэком по category) + название + cookTime + калории + 🏠 Семейный + AuthorAvatar (если добавил не я) + крестик удаления (только если мой).
- `FAB` — «+ В план» → `/dishes` (выбрать блюдо чтобы добавить в план).

**API:** `getMealPlans()` (как было) + `deleteMealPlan(id)` (как было). Бэкенд возвращает `dish` (id, name, imageUrl, images, categories), `user` (id, name), `userId`, `groupId`, `date`, `mealType` — этого достаточно. Опциональные `dish.cookTime` и `dish.calories` — если бэк когда-то начнёт их возвращать в этом select, отобразятся автоматически.

**Старый компонент `PlanItem`** (`components/domain/PlanItem.jsx`) **больше не используется**. В импорте `domain/index.js` он остался, но пустой балласт. Удалять отдельным коммитом или оставить — на твоё усмотрение (я бы оставила пока — мало ли где ещё всплывёт; уберу когда закроем все страницы).

## Файлы

```
modified:   frontend/src/pages/MealPlanPage.jsx
modified:   COMMIT_INSTRUCTIONS.md
```

`context/design/plan-v2.jsx` уже закоммичен в layout-коммит.

Сборка: 1851 модулей, без ошибок и warnings.

## Команды

```bash
cd <путь-к-mealbot>
git status                       # 2 файла modified
git branch --show-current        # main

git add frontend/src/pages/MealPlanPage.jsx COMMIT_INSTRUCTIONS.md

git commit -m "feat(plan): редизайн MealPlanPage

- 3 состояния: guest / empty / normal
- PageHeader (title + count·days), FilterChips (Все/Мои/Семейные —
  только если есть family-планы), MetaStrip (Сегодня/Неделя/Всего)
- TodayPinned: accent-muted блок с группировкой по mealType
- DayBlocks: для каждой будущей даты, группировка по mealType
- PlanRow: 60×60 фото с фолбэком, time/cal, AuthorAvatar для не-моих
- FAB → /dishes (выбрать блюдо)"

git push origin main
```

## На сервере

```bash
ssh root@194.87.130.215 "cd /var/www/mealbot && git pull && cd frontend && npm run build 2>&1 | tail -10"
```

Backend не трогаем.

## Что проверить после деплоя

### Гость
- `/plan` без логина → GuestBlock «Планируй меню заранее» + кнопки «Создать свою кухню» / «Уже есть аккаунт? Войти»

### Пустой план
- логин, но в плане нет блюд → EmptyState с Icon `CalendarPlus` («План пока пустой») + кнопка «Посмотреть блюда» → `/dishes`

### Рабочий вид
- header «План готовки» + справа «N блюд · M дней» (счётчик меняется при смене фильтра)
- если есть family-план — над MetaStrip-ом ряд из 3 чипов (Все / Мои / Семейные)
- ниже MetaStrip (Сегодня / Неделя / Всего); если Всего ≥ 5, эта ячейка sage-tint
- если на сегодня есть планы — accent-muted блок «Сегодня · ...» с группировкой по mealType (Завтрак/Обед/Ужин). Внутри — 60×60 фото + название + time/cal + крестик
- ниже — блоки по будущим датам в верхнем регистре
- FAB справа внизу «+ В план» → `/dishes`

### Действия
- крестик в углу строки плана (только если план создан тобой) → запрос `DELETE /api/meal-plans/:id` → строка пропадает
- тап по фото или названию → переход на деталку `/dishes/<id>`
- фильтр чипов: «Мои» оставляет только те, что добавил ты; «Семейные» — только те, что в family-группе
