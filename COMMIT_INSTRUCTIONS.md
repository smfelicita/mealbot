# Коммит: ProfilePage + AuthPage + cleanup

Ветка: `main`. Frontend-only (бэкенд не трогаем).

## Что сделано

### ProfilePage
Переписана под редизайн без дизайн-артефакта (по паттернам уже сделанных страниц):
- Hero (Avatar + name + email + role-чип)
- Контакты (Email/Phone + статусы «подтв.» / «не подтв.»)
- Подключения: Telegram-блок (подключён → sage-чип «подключено», не подключён → accent-кнопка «Подключить»)
- Аккаунт: «Выйти из аккаунта» (red-tint)
- **Не реализовано:** Pro-плашка, stats (24 блюда / серия / etc), смена языка, toggle уведомлений, удалить аккаунт — этих фич нет на бэке. Когда появятся — добавим секции по аналогии с брифом.

### AuthPage
Переписана под редизайн:
- Бренд-блок (ChefHat в muted-кружке + «MealBot» + «Умный помощник для выбора блюд»)
- Card с шагами (login / register / verify-email / phone-enter / phone-code)
- TabSwitcher Email/Телефон в pill-стиле с lucide-иконками
- PillInput (h-11 rounded-full bg-bg-2 border border-border)
- Button использует общий ui/Button (он уже редизайн)
- Google-кнопка `shape="pill"`
- Skip-link «Продолжить без регистрации →»
- Логика не тронута: API вызовы, state-машина шагов, countdown — всё как было

### Cleanup
- `frontend/src/App.jsx` — убраны backward-compat redirects `/v2/*` (главная/dishes/dishes/:id/fridge), удалена функция `RedirectV2Dish`, убран импорт `useParams`. После slim-main прошло достаточно времени — закладки уже устарели.
- `frontend/src/components/domain/PlanItem.jsx` — **удалён** (после редизайна `MealPlanPage` он больше не используется).
- `frontend/src/components/domain/index.js` — убран экспорт `PlanItem`.

### Контекст
- `CLAUDE.md` — добавлен раздел про редизайн (стратегия slim-main, статус страниц).
- `context/TASKS.md` — добавлен раздел «Редизайн (Phase A)» со списком готового и в очереди.
- `context/design/redesign-plan.md` — секция «Статус выполнения» сверху файла.

## Файлы

```
modified:   CLAUDE.md
modified:   context/TASKS.md
modified:   context/design/redesign-plan.md
modified:   frontend/src/App.jsx
deleted:    frontend/src/components/domain/PlanItem.jsx
modified:   frontend/src/components/domain/index.js
modified:   frontend/src/pages/AuthPage.jsx
modified:   frontend/src/pages/ProfilePage.jsx
modified:   COMMIT_INSTRUCTIONS.md
```

Сборка: 1850 модулей (минус 1 — PlanItem), без ошибок и warnings.

## Команды

Один коммит, один push:

```bash
cd <путь-к-mealbot>
git status                        # 8 файлов modified + 1 deleted + COMMIT_INSTRUCTIONS
git branch --show-current         # main

git add CLAUDE.md \
        context/TASKS.md \
        context/design/redesign-plan.md \
        frontend/src/App.jsx \
        frontend/src/components/domain/PlanItem.jsx \
        frontend/src/components/domain/index.js \
        frontend/src/pages/AuthPage.jsx \
        frontend/src/pages/ProfilePage.jsx \
        COMMIT_INSTRUCTIONS.md

git commit -m "feat: редизайн ProfilePage + AuthPage, cleanup /v2 и PlanItem

ProfilePage: Hero (Avatar+name+email+role), Контакты (email/phone +
verified-бейджи), Telegram-блок (подключено/не подключено), Выход.
Без Pro/stats/языка/уведомлений — этих фич нет на бэке.

AuthPage: бренд-блок ChefHat, pill-инпуты, lucide-иконки в табах,
Button через общий ui/Button. Логика как была — login/register/
verify-email/phone steps + Google + skip.

Cleanup:
- App.jsx: убраны редиректы /v2/* (после slim-main прошло время,
  закладки устарели)
- PlanItem.jsx удалён (после редизайна MealPlan не используется)
- index.js: убран экспорт PlanItem

Контекст:
- CLAUDE.md: раздел про редизайн
- TASKS.md: статус Phase A
- redesign-plan.md: статус выполнения сверху"

git push origin main
```

## На сервере

```bash
ssh root@194.87.130.215 "cd /var/www/mealbot && git pull && cd frontend && npm run build 2>&1 | tail -10"
```

Backend не трогаем.

## Что проверить после деплоя

### ProfilePage (`/profile`, требует логин)
- Hero: Avatar + имя + email + чип «Пользователь» (или «Администратор» если ADMIN)
- секция «Контакты»: email с verified-бейджем (sage если `emailVerified: true`)
- секция «Подключения»: Telegram-блок
  - не подключён → accent-кнопка «Подключить» → нажатие → ссылка → открывается бот
  - подключён → sage-чип «подключено», под названием — `@username`
- секция «Аккаунт»: ряд «Выйти из аккаунта» (красный) → logout → редирект на `/auth`

### AuthPage (`/auth`)
- бренд-блок: ChefHat в muted-кружке + «MealBot»
- по умолчанию — таб Email, форма Login (или Register если `?mode=register`)
- TabSwitcher: переключение Email ↔ Телефон с lucide-иконками
- pill-инпуты, accent-кнопка submit
- ссылка «Зарегистрироваться» / «Войти» переключает между login/register
- регистрация → если требуется верификация → шаг «Подтверди email» с кодом + countdown «Отправить повторно»
- Google-кнопка (если `VITE_GOOGLE_CLIENT_ID` настроен)
- Skip-link «Продолжить без регистрации →» снизу

### Cleanup проверка
- `https://<host>/v2` → теперь **404** (раньше редиректило на `/`). Это ожидаемо.
- `https://<host>/v2/dishes` → 404
- `https://<host>/v2/fridge` → 404
- `https://<host>/v2/dishes/<id>` → 404
- Если кому-то реально надо backward-compat — добавим редиректы на nginx.

### Сборка
- Бандл должен быть чуть меньше (минус PlanItem.jsx) — около 399-401 KB main.js.

## Статус редизайна

- ✅ Phase A основа: HomePage, DishesPage, DishDetailPage, FridgePage, MealPlanPage, ProfilePage, AuthPage, Layout
- ⏳ Phase B (ждут артефактов): ChatPage, DishFormPage, GroupsPage, GroupDetailPage, GroupFormPage
- 🧹 Будущая чистка: переименовать DishCardV2 → DishCard когда обновим Chat и GroupDetail
