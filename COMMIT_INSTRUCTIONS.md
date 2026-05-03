# Коммит: AuthPage fix + ProfilePage v2 + cleanup + контекст

Ветка: `main`. Frontend-only, бэкенд не трогаем.

## Что сделано

### AuthPage багфикс
В шагах `phone-enter` и `phone-code` не было TabSwitcher'а — пользователь, выбравший вход по телефону, не мог вернуться к email. Добавлен `<TabSwitcher tab={tab} onChange={switchTab} />` в `phone-enter`. На `phone-code` оставил без табов (это уже промежуточный шаг с введённым номером — переключение через «Изменить номер»).

### ProfilePage v2 (по артефакту)
Переписана по `context/design/profile-v2.jsx` — но **только то что есть на бэке**:

**Реализовано:**
- **Hero** — Avatar 72px (с Pro-обводкой если `subscriptionUntil > now`) + имя + Pro/Free-чип + email + «С нами с {createdAt}» (если бэк когда-то начнёт возвращать `createdAt` в `/me` select).
- **Telegram-row** — подключено / нет, accent-кнопка «Подключить» → `/api/auth/generate-telegram-link` → ссылка.
- **Настройки → Язык** — селектор Русский / English. Переключение работает через `i18n.changeLanguage(code)` + `localStorage.mealbot_lang` (через LanguageDetector cache). **Но переключение на English ничего не покажет** — в коде нигде нет `t()`. Это отмечено в самом UI селектора («English перевод появится позже»).
- **Аккаунт → Выйти из аккаунта** — `api.logout()` + store.logout() + переход на `/auth`.

**Не реализовано (по согласованию):**
- ❌ Stats (нет API)
- ❌ Pro-upgrade плашка / My Subscription (монетизация не запущена)
- ❌ Toggle уведомлений
- ❌ Удалить аккаунт (нет API)
- ❌ Версия приложения «MealBot v2.4.0» (не нужно сейчас)

### Контекст
- `context/TASKS.md` — добавлена новая задача в бэклоге: «i18n: обернуть строки в t() и добавить английский перевод».
- `context/design/profile-v2.jsx` — артефакт-источник, добавляем в репо.

### Новая задача в бэклоге
**i18n: обернуть строки в t() и добавить английский перевод.** Инфраструктура (i18next + LanguageDetector + namespaces) уже подключена. Переключатель в ProfilePage добавлен. Но в коде нигде нет вызовов `t()` — все строки хардкодом. Надо: пройтись по всем страницам/компонентам, заменить русский хардкод на `t('namespace:key')`, и заполнить `frontend/src/locales/en/*.json`.

## Файлы

```
modified:   COMMIT_INSTRUCTIONS.md
modified:   context/TASKS.md
modified:   frontend/src/pages/AuthPage.jsx
modified:   frontend/src/pages/ProfilePage.jsx
new file:   context/design/profile-v2.jsx        (артефакт-источник)
```

Сборка: 1850 модулей, без ошибок.

## Команды

```bash
cd <путь-к-mealbot>
git status                       # ожидается список выше
git branch --show-current        # main

git add COMMIT_INSTRUCTIONS.md \
        context/TASKS.md \
        context/design/profile-v2.jsx \
        frontend/src/pages/AuthPage.jsx \
        frontend/src/pages/ProfilePage.jsx

git commit -m "feat: ProfilePage v2 + AuthPage fix

ProfilePage v2 (по артефакту profile-v2.jsx):
- Hero: avatar 72px с Pro-обводкой (по subscriptionUntil), Pro/Free-чип
- Telegram-row как был
- Настройки → Язык (RU/EN селектор через i18n.changeLanguage)
- Выход
- Pro-плашка/stats/уведомления/удалить аккаунт — не делаем,
  фич нет на бэке; добавим когда появятся

AuthPage fix: TabSwitcher на шаге phone-enter — раньше нельзя
было вернуться к Email после выбора Телефона.

В бэклог TASKS.md добавлена задача i18n: обернуть строки в t() +
английский перевод (инфраструктура уже подключена)."

git push origin main
```

## На сервере

```bash
ssh root@194.87.130.215 "cd /var/www/mealbot && git pull && cd frontend && npm run build 2>&1 | tail -10"
```

Backend не трогаем.

## Что проверить после деплоя

### AuthPage — багфикс
- `/auth` → таб «Телефон» → должны быть видны два таба сверху, можно переключиться обратно на «Email».
- На шаге `phone-code` (после ввода телефона и получения кода) — табов нет, но есть «Изменить номер» (это ожидаемо).

### ProfilePage v2 (`/profile`, требует логин)
- **Hero:** Avatar 72px с инициалом, имя, чип «Free» (или «Pro» если `subscriptionUntil > now`), email под, «С нами с …» если бэк отдаёт `createdAt`.
- **Подключения:** Telegram-блок
  - не подключён → accent-кнопка «Подключить» → ссылка → бот
  - подключён → sage-чип «Подключено» + `@username`
- **Настройки → Язык интерфейса:** клик → раскрывается список (Русский / English) + подсказка «English перевод появится позже». Выбор «English» меняет `localStorage.mealbot_lang` на `en` (можно проверить через DevTools), но визуально ничего не меняется — это ок.
- **Аккаунт → Выйти из аккаунта:** красная плашка → клик → выход → `/auth`.

### Cleanup
- `https://<host>/v2` → теперь 404 (раньше редиректило на `/`). Если в Telegram где-то остались ссылки на `/v2/...` — их надо обновить руками или вернуть редирект.

## Статус редизайна

- ✅ Phase A: HomePage, DishesPage, DishDetailPage, FridgePage, MealPlanPage, ProfilePage (v2), AuthPage, Layout
- ⏳ Phase B (ждут артефакта): ChatPage, DishFormPage, GroupsPage, GroupDetailPage, GroupFormPage
- 🧹 Будущая чистка: переименовать DishCardV2 → DishCard когда обновим Chat и GroupDetail
- 📚 Бэклог: i18n переводы (см. TASKS.md)
