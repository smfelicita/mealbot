# Коммит: Layout редизайн (header + tab bar)

Ветка: `main`. Frontend-only (бэкенд не трогаем).

## Что сделано

Полностью переписан `frontend/src/components/Layout.jsx` под редизайн:

**Header — три режима, выбираются автоматически по pathname:**
- `mode: 'root'` — корневые страницы (`/`, `/dishes`, `/fridge`, `/plan`): лого ChefHat-в-muted-кружке + «MealBot / Моя кухня» + Bell + Avatar (или «Войти»). Sticky сверху, тень снизу.
- `mode: 'back'` — вложенные страницы (`/profile`, `/groups/*`, `/dishes/new`, `/dishes/:id/edit`): кнопка `←` слева, title по центру, Bell + Avatar справа.
- `mode: 'none'` — деталка `/dishes/:id` (full-bleed). Layout не рендерит свой header — деталка ставит свою back-кнопку поверх hero-фото (как было).

**TabBar — 4 таба:**
- Главная / Блюда / Холодильник / План
- lucide-иконки (Home, ChefHat, Refrigerator, Calendar)
- Активный — accent-line сверху + accent-цвет
- Профиль — через avatar в header (не в табах)
- Чат — закомментирован флагом `CHAT_ENABLED = false`. Когда фича будет готова — переключить на `true`, пятый таб (Sparkles) сразу появится. Опционально: `chatDot` — красная точка на иконке (пока не используется).

**Bell** — заглушка. Иконка кликается, но onClick пустой (TODO для notifications). Красная точка сверху если `count > 0` (сейчас всегда 0).

**ProfileModal** — оставлена как была (выпадайка по avatar): группы, Telegram-бот, Профиль, Выход.

## Файлы

```
modified:   frontend/src/components/Layout.jsx
new file:   context/design/layout-v2.jsx        (артефакт-источник)
new file:   context/design/plan-v2.jsx          (заодно подъехал, оставляем)
modified:   COMMIT_INSTRUCTIONS.md
```

Сборка: 1851 модулей, без ошибок.

## Команды

```bash
cd <путь-к-mealbot>
git status                       # посмотреть, всё ли как ожидалось
git branch --show-current        # должна быть main

git add frontend/src/components/Layout.jsx \
        context/design/layout-v2.jsx \
        context/design/plan-v2.jsx \
        COMMIT_INSTRUCTIONS.md

git commit -m "feat(layout): редизайн header + tab bar

- 3 режима header автоматически по pathname:
  - root (/, /dishes, /fridge, /plan): лого + Bell + Avatar
  - back (/profile, /groups/*, /dishes/new, /dishes/:id/edit): ← + title
  - none (/dishes/:id): full-bleed (деталка ставит свою back-кнопку)
- TabBar: 4 таба (Главная/Блюда/Холодильник/План), lucide-иконки,
  accent-line на активном
- Чат-таб скрыт флагом CHAT_ENABLED=false — легко вернуть
- Bell — заглушка (без notifications API пока)"

git push origin main
```

## На сервере

```bash
ssh root@194.87.130.215 "cd /var/www/mealbot && git pull && cd frontend && npm run build 2>&1 | tail -10"
```

Backend не трогаем.

## Что проверить после деплоя

### Корневые страницы (header с лого)
- `/` главная — лого «MealBot / Моя кухня» слева + Bell + Avatar справа
- `/dishes` — то же
- `/fridge` — то же
- `/plan` — то же

### Деталка
- `/dishes/<id>` — full-bleed, фото на полный экран, своя back-кнопка поверх фото. Layout-header **не виден**.

### Вложенные (back-header)
- `/profile` — `← Профиль  Bell Avatar`
- `/groups` — `← Мои группы  Bell Avatar`
- `/groups/<id>` — `← Группа  Bell Avatar`
- `/dishes/new` — `← Новое блюдо  Bell Avatar`

### TabBar
- Внизу 4 иконки: Home, ChefHat, Refrigerator, Calendar
- На активной — горизонтальная accent-линия сверху + accent-цвет иконки/подписи
- На неактивных — text-3 (серый)
- Чат **не должен быть виден**
- Тап на таб → переход; URL меняется

### Header кнопки
- Bell (колокольчик) — кликается, ничего не происходит (это ок, заглушка)
- Avatar (кружок с инициалом) — открывает ProfileModal (как было)
- Если не залогинен — вместо Avatar кнопка «Войти» (accent-fill pill)

### Гость
- Залогинься → выйди → проверь что виден только home + dishes (Холодильник/План скрыты от гостя)
