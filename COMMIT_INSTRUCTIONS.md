# Коммит: DishFormPage + DishIngredientPicker

Ветка: `main`. Frontend-only, бэкенд не трогаем.

## Что сделано

### Layout (mode='none' для DishForm)

В `getHeaderMode` добавлены явные ветки для `/dishes/new` и `/dishes/:id/edit` → `mode: 'none'`. Layout не рендерит свой back-header — DishFormPage рисует свой sticky-header с back-кнопкой и кнопкой «Сохранить» (как в артефакте).

**Заодно фикс бага:** раньше на `/dishes/:id/edit` рисовалось два хедера — один Layout-back, второй внутренний `fixed top-0`. Теперь один.

### DishFormPage (полный редизайн)

Портирована из `context/design/dish-form-v2.jsx`. Сохранена вся логика:
- Режимы Quick / Extended (только при создании, edit всегда extended)
- copyFrom (создаёт копию рецепта как PRIVATE) + groupContext (`location.state`)
- Image upload с главной фоткой ★ и удалением
- Video upload
- Picker ингредиентов через переписанный `DishIngredientPicker`
- Visibility radio-cards (FAMILY показывается только если есть family-группа)

Визуал по артефакту:
- **FormHeader 52px** — back + title + Сохранить (disabled пока невалидно)
- **Banners** сверху — для groupContext (accent-muted) и copyFrom (sage-muted)
- **ModeSwitcher** pill-style сегмент Быстро/Расширенно
- **PillInput / PillTextarea** — все поля в pill (h-11, rounded-full) или rounded-2xl для textarea
- **ChipsField** — для категорий и mealTime
- **PhotoGrid** — 3-колонки aspect-square, главное фото с ring-2 accent + ★, остальные с ★-кнопкой (тап → сделать главным), ✕-кнопка удаления
- **VideoField** — sage-карточка «Видео загружено» когда есть, или загрузить
- **IngredientRow** — с MiniSwitch «вкус», когда on — скрывается qty/unit, ставится «по вкусу»
- **VisibilityCards** — radio-cards с lucide-иконками (Lock / Users / Globe), активная accent-muted
- **Submit** дублируется внизу формы, чтобы не скроллить вверх

### DishIngredientPicker (полный редизайн)

Был старый Modal-стилевой 105 строк. Переписан под bottom-sheet:
- Handle сверху, header «Добавить ингредиент» + ✕
- Pill-search с Search-иконкой, кнопкой очистки
- Скроллящиеся chips категорий (Все / Молочное / Мясо / Овощи / …)
- Grid 2 колонки с карточками ингредиентов (эмодзи + nameRu + бейдж «мой» для персональных)
- Кнопка «Создать «query»» когда поиск не нашёл, или «Нет нужного? Добавить свой» внизу списка
- Свёрнутая форма создания ингредиента (название + категория)
- Sticky footer-кнопка «Готово · N выбрано»

API сохранён (props: `allIngredients`, `selected`, `onAdd`, `onIngredientCreated`, `onClose`, `show`).

### Контекст

- `CLAUDE.md` — DishFormPage в готовых
- `context/TASKS.md` — добавлены DishFormPage и DishIngredientPicker в Phase A; в очереди остаётся только ChatPage

## Файлы

```
modified:   CLAUDE.md
modified:   COMMIT_INSTRUCTIONS.md
modified:   context/TASKS.md
modified:   frontend/src/components/Layout.jsx
modified:   frontend/src/components/domain/DishIngredientPicker.jsx
modified:   frontend/src/pages/DishFormPage.jsx
new file:   context/design/dish-form-v2.jsx       (артефакт-источник)
```

Сборка: 1850 модулей, без ошибок.

## Команды

```bash
cd <путь-к-mealbot>
git status                       # ожидается список выше
git branch --show-current        # main

git add CLAUDE.md \
        COMMIT_INSTRUCTIONS.md \
        context/TASKS.md \
        context/design/dish-form-v2.jsx \
        frontend/src/components/Layout.jsx \
        frontend/src/components/domain/DishIngredientPicker.jsx \
        frontend/src/pages/DishFormPage.jsx

git commit -m "feat(dish-form): редизайн DishFormPage + DishIngredientPicker

Layout: mode='none' для /dishes/new и /dishes/:id/edit (fix —
раньше на edit рисовалось два хедера).

DishFormPage:
- свой sticky FormHeader (back + Сохранить)
- ModeSwitcher Быстро/Расширенно
- pill-инпуты, textarea rounded-2xl
- PhotoGrid 3-колонки (главное фото со звездой)
- IngredientRow с MiniSwitch «по вкусу»
- VisibilityCards radio с lucide-иконками
- Submit дублируется внизу

DishIngredientPicker:
- переписан как bottom-sheet (handle, поиск, chips категорий, grid)
- кнопка «Создать своё» при пустом поиске + свёрнутая форма
- API сохранён"

git push origin main
```

## На сервере

```bash
ssh root@194.87.130.215 "cd /var/www/mealbot && git pull && cd frontend && npm run build 2>&1 | tail -10"
```

Backend не трогаем.

## Что проверить после деплоя

### `/dishes/new`
- Sticky-header сверху: ← + «Новый рецепт» + кнопка «Сохранить» (disabled пока не введено название и mealTime)
- ModeSwitcher: Быстро / Расширенно. По умолчанию Быстро.
- В **Quick** mode видны только: Название, Категории, Когда есть, Ингредиенты, Доступ, Submit
- Переключение на **Extended** добавляет: Описание, Время готовки, Теги, Фото, Видео, Рецепт
- Pill-инпут «Название» + AlertCircle при пустом
- Чипы категорий (Суп / Салат / …) и времени приёма (Утро / Обед / …) — multi-select
- Тап на «+ Добавить ингредиент» → открывается bottom-sheet picker
- В picker: pill-поиск, chips категорий, grid карточек. Поиск «помидор» → отфильтровано. Тап на карточку → ингредиент добавляется в форму, picker закрывается.
- Если ничего не нашлось — кнопка «Создать «query»» → форма с pill-инпутом и select категории → «Добавить» создаёт через API
- В строке ингредиента: MiniSwitch «вкус» — переключение скрывает qty/unit
- VisibilityCards: PRIVATE / FAMILY (если есть family-группа) / ALL_GROUPS
- Submit «Создать блюдо» → редирект на `/dishes/<id>`

### `/dishes/<id>/edit`
- Sticky-header «Редактировать рецепт» + Сохранить
- Все поля заполнены данными блюда
- Сохранение → toast «Рецепт сохранён» → редирект на деталку

### Banners
- Если на форму пришли с `?copyFrom=<id>` — sage-баннер «Это копия рецепта…»
- Если на форму пришли через `state.groupId` (например, из GroupDetailPage → «+ Добавить») — accent-баннер «Блюдо будет добавлено в группу „…"»; visibility по умолчанию FAMILY/ALL_GROUPS

### Photo grid
- Grid 3 колонки, aspect-square
- Главное фото — accent-ring + ★ заливка
- Тап на ★ другого фото → делает главным (порядок меняется, имя главного фото идёт в `imageUrl`)
- ✕ удаляет
- Кнопка «+ Добавить ещё» (или «Загрузить фото») — multi-select, до 10 штук

### Edge cases
- Quick → Extended → Quick: данные не теряются (state общий)
- Если у юзера нет family-группы — опция FAMILY скрыта в VisibilityCards
- На длинной форме «Сохранить» доступен и сверху, и снизу

## Статус редизайна

- ✅ **Phase A почти завершена**: HomePage, DishesPage, DishDetailPage, FridgePage, MealPlanPage, ProfilePage, AuthPage, GroupsPage, GroupDetailPage, GroupFormPage, **DishFormPage**, Layout
- ⏳ В очереди: ChatPage (фича скрыта от пользователей — низкий приоритет)
- 🧹 Будущая чистка: переименовать `DishCardV2` → `DishCard` после редизайна Chat
