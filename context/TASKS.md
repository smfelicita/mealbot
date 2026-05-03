# Задачи проекта MealBot

## ✅ Сделано

### Бэкенд
- [x] Express сервер с CORS, helmet, rate limiting
- [x] Prisma схема (Users, Dishes, Ingredients, FridgeItems, ChatMessages, Groups, GroupMembers, MealPlan, Favorite, PushSubscription, GroupInvite, Comment)
- [x] JWT авторизация (register / login / Google OAuth) + token versioning (server-side invalidation)
- [x] Авторизация: email + код подтверждения (Resend)
- [x] Авторизация: по номеру телефона + SMS-код
- [x] Авторизация: Google OAuth (auto-link к существующему email-аккаунту)
- [x] API блюд с инклюзивной фильтрацией (хотя бы один продукт совпадает)
- [x] API блюд с эксклюзивной фильтрацией (режим холодильника)
- [x] API холодильника (add / remove / bulk / clear)
- [x] ИИ-чат через Claude API с контекстом холодильника
- [x] Seed данных: 20 блюд + 187 ингредиентов с рецептами на русском
- [x] Загрузка файлов (фото/видео) через Supabase Storage
- [x] API групп (CRUD + join/leave/kick) с типами FAMILY/REGULAR
- [x] Семейный холодильник (общий для FAMILY группы, автомиграция при вступлении)
- [x] 4 уровня видимости рецептов: PRIVATE / PUBLIC / FAMILY / ALL_GROUPS
- [x] ИИ с лимитами: гость 2 сообщ/день по IP, авторизованный 10/день (БД)
- [x] Фильтр сообщений ИИ: blocklist по ключевым словам (backend/src/lib/messageFilter.js)
- [x] Умный поиск блюд: по названию, описанию, ингредиентам, тегам
- [x] Единый PrismaClient singleton
- [x] План питания: MealPlan модель, API (add/get/delete), семейный план
- [x] ИИ возвращает блюда из БД с маркерами [DISH:id], PRO/ADMIN — без ограничений
- [x] КБЖУ: поля protein/fat/carbs/avgWeightG/isBasic у Ingredient, расчёт при сохранении блюда
- [x] Привязка Telegram к аккаунту: generate-telegram-link (rate limit 1/мин), one-time token
- [x] Telegram web-авторизация: GET /auth/tg?token= (10 мин), выдача JWT
- [x] Аккаунт-мёрж при привязке Telegram: миграция холодильника и планов питания
- [x] Автоочистка просроченных pendingTelegramLink при старте бота
- [x] API профиля: GET /auth/me (обновляет lastActiveAt)
- [x] Rate limiting на генерацию Telegram-ссылки (1 запрос/мин)
- [x] Избранные рецепты: API /favorites (GET / POST / DELETE), фильтр dishes?favorites=true
- [x] Telegram-уведомления: семейные события (план питания), ежедневные предложения, напоминание о холодильнике
- [x] Планировщик уведомлений: node-cron, ежечасная проверка, 16:00 по таймзоне пользователя
- [x] Количество ингредиентов в холодильнике (quantityValue + quantityUnit)
- [x] Фильтрация: не учитывать toTaste=true ингредиенты
- [x] isBasic=true: 20 продуктов — не требуются в холодильнике при фильтрации
- [x] Комментарии к рецептам: модель Comment, API /api/comments (CRUD + pin), доступ по принципу "видишь блюдо в группе — можешь комментировать" (кроме PUBLIC)
- [x] Приглашения в группу по email: one-time token (TTL 7 дней), route /api/invites
- [x] Безопасность инвайтов: FAMILY — только owner, проверка email при accept, rate limit (3/день/email, 10/день/sender)
- [x] Полный аудит авторизации: token versioning, loginLimiter, Google auto-link, транзакции
- [x] Полный аудит групп: видимость, лимиты, транзакционность, kick/leave
- [x] REGULAR группы — временно отключены (UI скрыт, backend 503/400)
- [x] Единый error middleware (Prisma errors, JSON parse, 5xx без утечки деталей)
- [x] Zod-валидация на всех write-эндпоинтах (groups, dishes, invites, comments, fridge, meal-plans)
- [x] Структурированное логирование: pino, requestId, maskEmail, redact чувствительных полей
- [x] LOG_LEVEL и NODE_ENV управляют verbosity и форматом логов (см. FUNCTIONAL_SPEC.md)
- [x] Rate limit на /api/comments POST (30/час по DB)
- [x] Логирование критичных действий (auth, группы, инвайты, fridge, meal-plans, comments)
- [x] Индексы в БД (authorId, visibility, groupId, createdAt, userId, platform, dishId)
- [x] Пагинация в /api/dishes (limit/offset, возвращает total)

### Фронтенд
- [x] React + Vite + PWA manifest + iOS meta-теги
- [x] Светлая тема — фон #F6F4EF, Tailwind v4, CSS reset в @layer base
- [x] Авторизация (email/пароль, Google OAuth, SMS)
- [x] Фиксированный хедер с логотипом, аватар-кнопка профиля, кнопка "Войти" для гостей
- [x] Переключатель 🧊 режима холодильника в хедере
- [x] Профильное модальное окно (имя, email, подключить Telegram, профиль, выйти)
- [x] Страница профиля: email, телефон, Telegram-статус, кнопка привязки
- [x] Страница /auth/tg: авторизация по одноразовому токену от бота — переписана на Tailwind (нет легаси CSS)
- [x] Главная страница: фильтр по времени дня, динамический список под viewport (ResizeObserver)
- [x] Страница "Блюда" (DishesPage): поиск, фильтр-чипы, FAB добавить рецепт, SVG иконки, Tailwind-only
- [x] Страница блюда (DishDetailPage): full-screen overlay fixed inset-0, слайдер "Осталось докупить", секция комментариев, КБЖУ открыто по умолчанию
- [x] Холодильник (добавить/удалить, поиск с автодополнением, группировка по категориям, FAB)
- [x] ИИ-чат с быстрыми подсказками, inline карточки блюд из ответа ИИ
- [x] Мои рецепты + форма создания/редактирования (режимы Быстро / Расширенно)
- [x] Группы (создание, управление участниками)
- [x] Блокировка холодильника для гостей с CTA
- [x] Счётчик сообщений ИИ для гостей, блок после 2 с CTA
- [x] Все "Рецепты" переименованы в "Блюда" (Layout, BottomTabBar, GroupDetailPage)
- [x] Все эмодзи в навигации/иконках заменены на SVG
- [x] Комментарии к рецептам: модель Comment (БД), API /api/comments, UI в DishDetailPage (CommentsSection)
- [x] Страница плана питания + модалка добавления в план
- [x] Аудит фронтенда: система документов (context/audits/ × 7, context/frontend-rules.md)
- [x] SVG иконки — нет hardcoded цветов, везде currentColor + Tailwind класс на wrapper
- [x] Domain-компоненты: GroupHeader, GroupCard, PlanItem, DishCard (варианты grid/row/inline)
- [x] DishCard: helper getDishMeta() — нет дублей логики получения img/cat/emoji
- [x] Email-валидация на форме приглашения в группу (клиентская сторона)
- [x] Состояния ошибок загрузки на HomePage, DishesPage, DishDetailPage, GroupsPage (useToast / errorState)
- [x] text-[11px] → text-2xs (массовая замена)
- [x] FridgePage: убран дублирующий топбар, добавлен FAB для "+ Добавить"
- [x] Исправлена видимость блюд в группах: ALL_GROUPS и FAMILY теперь корректно отображаются

### Telegram-бот
- [x] Меню с кнопками (Завтрак / Обед / Ужин / Перекус)
- [x] Просмотр и управление холодильником (текстовые команды + продукты / - продукты)
- [x] Блюда из холодильника
- [x] ИИ-чат (явная активация, отдельный режим) — **временно скрыт** (кнопка убрана из меню, код закомментирован)
- [x] Случайное блюдо / рецепты по кнопке
- [x] Привязка к веб-аккаунту (deep link /start link_TOKEN)
- [x] Кнопка "🌐 Открыть приложение" → one-time token → авторизация в браузере
- [x] Fuzzy-поиск ингредиентов (fastest-levenshtein)
- [x] /start с подтверждением если сессия активна
- [x] Автоочистка просроченных токенов при старте

### Деплой
- [x] VPS Timeweb (IP 194.87.130.215), домен smarussya.ru
- [x] nginx + PM2 + HTTPS (Let's Encrypt)
- [x] Claude Code на сервере

### Редизайн (Phase A — порт артефактов)
- [x] Дизайн-система: токены, типографика, отступы, иконки lucide (`context/design/design-system.md`)
- [x] HomePage (главная) — портирована
- [x] DishesPage (каталог) — портирована, с paging / filters / BulkAdd
- [x] DishDetailPage (деталка) — full-bleed hero, КБЖУ на 100 г
- [x] FridgePage (холодильник) — picker, family-баннер, telegram-баннер
- [x] MealPlanPage (план готовки) — TodayPinned, FilterChips Все/Мои/Семейные
- [x] ProfilePage — без Pro-плашки/stats (нет на бэке)
- [x] AuthPage — pill-инпуты, lucide-иконки
- [x] Layout — header (root/back/none) + TabBar (4 таба, чат скрыт флагом)
- [x] **Slim-main**: убран `/v2`-префикс, V2-файлы переименованы в основные, redesign-ветка слита и архивирована
- [x] **Cleanup**: удалены backward-compat redirects `/v2/*`, удалён `PlanItem.jsx`
- [x] КБЖУ переписан с «на блюдо» на «на 100 г», скрипт пересчёта
- [x] `store.fridge` загружается при старте (раньше — только при заходе на FridgePage)
- [x] Фильтр `difficulty` на серверной стороне в GET /api/dishes

В очереди (Phase B — оставшиеся страницы):
- [ ] ChatPage — нужен артефакт (фича скрыта от пользователей)
- [ ] DishFormPage — нужен артефакт (или бриф)
- [ ] GroupsPage / GroupDetailPage / GroupFormPage — нужен артефакт
- [ ] DishCardV2 → DishCard (переименование когда старый DishCard перестанет использоваться в Chat/GroupDetail)

---

## 📋 Бэклог

### Качество и надёжность
- [ ] Integration-тесты: auth flow, invite flow, fridge migration, access control

### Рецепты
- [ ] Список покупок: автогенерация из выбранных блюд

### Уведомления
- [ ] Напоминание о продуктах (примерный срок хранения)

### Pro-фичи (монетизация)
- [ ] Распознавание чеков (OCR + ИИ)
- [ ] Распознавание еды по фото холодильника
- [ ] Порционный калькулятор

### ИИ-чат (веб)
- [ ] Возврат ИИ-помощника: проработка затрат (токены на запрос, лимиты, модель), стратегия монетизации или субсидирования
- [ ] Фильтр сообщений: переделать с blocklist на whitelist (блокировать если нет food-related ключевых слов)

### Аналитика и инфраструктура
- [ ] Провести анализы по плану → см. context/system-analysis-plan.md (VPS, БД, Claude API, backend, frontend)

### Дизайн-система / фронтенд
- [ ] Произвольные размеры шрифта — ввести именованные токены в tailwind.config для `text-[13px]`, `text-[15px]`, `text-[17px]`, `text-[22px]`, `text-[24px]`, `text-[26px]` и заменить (text-[11px] → text-2xs уже сделано)
- [ ] **i18n: обернуть строки в t() и добавить английский перевод** — инфраструктура (i18next + LanguageDetector + namespaces) уже подключена в `frontend/src/i18n.js`, переключатель в ProfilePage добавлен и работает (`localStorage.mealbot_lang`), но реального переключения языка не происходит — нет вызовов `t()` в коде. Надо: (1) пройтись по всем страницам/компонентам, заменить хардкод русского на `t('namespace:key')`; (2) заполнить `frontend/src/locales/en/*.json`. После этого выбор «English» в селекторе профиля начнёт работать.

### Прочее
- [ ] SEO: SSR или prerender для карточек блюд
- [ ] Аналитика (DAU, популярные блюда)
- [ ] Мультиязычность (EN)
- [ ] Админка: управление пользователями, рецептами, ингредиентами, группами и статистикой
