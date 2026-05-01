# Slim-main: срез /v2 + merge redesign → main

Цель: убрать `/v2`-префикс, удалить старые версии 4 страниц (HomePage/DishesPage/DishDetailPage/FridgePage), слить `redesign` в `main`. Дальнейший редизайн остальных страниц (chat/plan/profile/groups/...) идёт прямо в `main` правкой существующих `*Page.jsx`.

## Что сделано в working copy

- ✅ Удалены старые `HomePage.jsx`, `DishesPage.jsx`, `DishDetailPage.jsx`, `FridgePage.jsx` (без V2)
- ✅ Удалён `components/domain/DishList.jsx` (использовался только старой каталог-страницей)
- ✅ V2-файлы переименованы: `*PageV2.jsx` → `*Page.jsx`. Внутри: компоненты, шапки-комментарии, `/v2/...` → `/...`
- ✅ `App.jsx`: убраны импорты V2, убраны `v2/*`-роуты, добавлены redirect-роуты `/v2/* → /*` (на 1-2 недели для совместимости со старыми закладками — потом можно убрать)
- ✅ `components/domain/index.js`: убран `DishList` экспорт
- ✅ Билд проходит (1851 модулей, бандл 399 KB / 119 KB gzip)

## DishCardV2 не трогали

Старый `DishCard.jsx` нужен ещё для `ChatPage` и `GroupDetailPage` (старые экраны с inline-карточками). `DishCardV2` — отдельный компонент для новых страниц. Когда будем редизайнить chat/groups — переименуем `DishCardV2` → `DishCard` и удалим старый одним коммитом.

---

## Команды

```bash
cd <путь-к-mealbot>
git status                    # посмотреть, всё ли как ожидалось
git branch --show-current     # должна быть redesign

# git распознаёт переименования автоматически (Renames в diff)
git add frontend/src/pages/ \
        frontend/src/components/domain/ \
        frontend/src/App.jsx \
        COMMIT_INSTRUCTIONS.md

# проверь — должны быть renames, не «delete + new file»
git status                    # ожидается: 4 renames в pages/, deletes для DishList и старых *Page

git commit -m "refactor: slim-main, срез /v2 (HomePage/DishesPage/DishDetailPage/FridgePage)

Все 4 редизайн-страницы теперь живут на основных URL (/, /dishes,
/dishes/:id, /fridge). Старые версии этих страниц удалены, V2-файлы
переименованы. /v2/* временно редиректит на основные URL для
совместимости со старыми закладками.

Удалён DishList (использовался только старой DishesPage). DishCardV2
оставлен как отдельный компонент — будет переименован в DishCard когда
будут редизайниться ChatPage / GroupDetailPage."

git push origin redesign
```

---

## Слияние redesign → main

```bash
git checkout main
git pull origin main

git merge redesign --no-ff -m "merge: redesign → main (slim-main)

Срез /v2-префикса, редизайн на основных URL для главной/каталога/
деталки/холодильника. Дальнейший редизайн остальных страниц
делается прямо в main правкой существующих *Page.jsx."

git push origin main
```

`--no-ff` обязателен — оставит merge-коммит с понятным сообщением, видно что было слияние.

---

## Сохранение redesign-ветки

После успешного merge и проверки на сервере — переименовать в архив (на случай отката):

```bash
git branch -m redesign archive/redesign
git push origin archive/redesign
git push origin --delete redesign
git branch --set-upstream-to=origin/archive/redesign archive/redesign
```

---

## Деплой на сервер

```bash
cd <путь-к-mealbot>
git checkout main
git pull
cd frontend && npm run build
# backend не трогаем
```

---

## Что проверить после деплоя

### Основные URL (теперь редизайн)
- `https://<host>/` → редизайн HomePage
- `https://<host>/dishes` → редизайн каталога с фильтрами
- `https://<host>/dishes/<id>` → редизайн деталки
- `https://<host>/fridge` → редизайн холодильника

### Backward-compat редиректы
- `https://<host>/v2` → редирект на `/`
- `https://<host>/v2/dishes` → редирект на `/dishes`
- `https://<host>/v2/dishes/<id>` → редирект на `/dishes/<id>` (с тем же id)
- `https://<host>/v2/fridge` → редирект на `/fridge`

### Навигация
- TabBar внизу: `/` `/dishes` `/fridge` `/plan` — все ведут куда надо
- Тап карточки блюда из главной/каталога/чата → редизайн-деталка
- FAB в каталоге → `/dishes/new` (старая форма создания, ок)
- Возврат с деталки несуществующего блюда → `/` (главная)

### Старые страницы без редизайна (должны работать как раньше)
- `/chat` — старый дизайн
- `/plan` — старый дизайн
- `/profile` — старый дизайн
- `/groups` — старый дизайн
- `/dishes/new`, `/dishes/<id>/edit` — старая форма

---

## Откат

Если что-то критично сломалось:

```bash
git checkout main
git revert -m 1 <merge-commit-hash>     # откатывает merge
git push origin main

# на сервере
git pull && cd frontend && npm run build
```

`archive/redesign` остаётся как точка возврата.

---

## Что дальше (после slim-main)

**Стратегия 1** для оставшихся страниц — правка существующих `*Page.jsx` прямо в `main`:
- ChatPage (есть `brief-chat.md`)
- MealPlanPage (есть `brief-meal-plan.md`)
- DishFormPage
- GroupsPage / GroupDetailPage / GroupFormPage (есть `brief-groups.md`)
- ProfilePage (есть `brief-profile.md`)
- AuthPage (есть `brief-auth.md`)

Поток: получаем артефакт → переписываем содержимое `*Page.jsx` → билд → коммит в `main` → деплой.

**Из бэк-логов:**
- Task #19 — фильтр `difficulty` на сервере (сейчас клиентский на DishesPage). Можно сделать любым моментом.
