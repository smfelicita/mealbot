# MealBot — аудит страниц и план редизайна

Составлено на основе обзора всех страниц `frontend/src/pages/` и слоя `components/domain/`. Цель — зафиксировать, что где есть, какие паттерны повторяются, и в каком порядке редизайнить.

---

## ⚡ Статус выполнения (актуально)

**Стратегия:** slim-main — без `/v2`-префикса, правка существующих `*Page.jsx` напрямую в `main`.

**Сделано:**
- ✅ HomePage, DishesPage, DishDetailPage, FridgePage (Phase A — портировано из артефактов)
- ✅ Layout (header + TabBar, 4 таба, чат скрыт флагом)
- ✅ MealPlanPage (TodayPinned + FilterChips + MetaStrip)
- ✅ ProfilePage (без Pro/stats — этого нет на бэке)
- ✅ AuthPage (pill-инпуты, lucide-иконки, без emoji в табах)
- ✅ Cleanup: backward-compat редиректы `/v2/*` убраны, `PlanItem.jsx` удалён

**В очереди:**
- ⏳ ChatPage — ждёт артефакт (фича скрыта от пользователей)
- ⏳ DishFormPage — ждёт артефакт
- ⏳ GroupsPage / GroupDetailPage / GroupFormPage — ждёт артефакт
- ⏳ DishCardV2 → DishCard (переименовать когда обновим Chat и GroupDetail)

---

## 1. Карта страниц

Всего **14 страниц**. Разделяю на 3 приоритетные группы.

### 🟢 Приоритет 1 — ядро ежедневного использования

Эти экраны пользователь видит каждый день. Редизайним первыми — сюда придёт максимум ценности.

| Страница | Что делает | Состояния | Сложность |
|---|---|---|---|
| **HomePage** | Главная: «Что приготовить сегодня?» Фильтр по времени дня, список блюд под viewport, quick actions | guest / authed, пустой холодильник, нет блюд | средняя |
| **DishesPage** | Каталог: поиск, фильтр-чипы (время еды), QuickFilters (холодильник/избранное/фильтры), infinite scroll, FAB | guest / authed, первое блюдо, loading, empty, filtered empty, bulk add hint | высокая |
| **DishDetailPage** | Детальная блюда — **уже спроектирован v2** | ✅ done | — |
| **FridgePage** | Холодильник: список с группировкой по категориям, inline-редактор количества, picker-modal, Telegram-баннер, FAB | guest block, пустой, с продуктами, picker (search / grouped chips), editing | высокая |
| **ChatPage** | ИИ-чат: bubbles, typing, suggestions, inline DishCard в ответах | guest CTA, welcome + suggestions, conversation, loading | средняя |
| **MealPlanPage** | План питания: группировка по дате → по mealType, PlanItem | guest, пустой, с планами | низкая |

### 🟡 Приоритет 2 — поддерживающие экраны

Реже используются, но на них лежит вся «семья / кухня / профиль».

| Страница | Что делает | Состояния | Сложность |
|---|---|---|---|
| **GroupsPage** | Мои группы: FAMILY и REGULAR, вступить по коду, создать | empty, с группами | низкая |
| **GroupDetailPage** | Группа: участники, инвайты, настройки, kick/leave | owner / member, FAMILY / REGULAR | средняя |
| **GroupFormPage** | Создание/редактирование группы | — | низкая |
| **ProfilePage** | Email, телефон, Telegram, выход | подключённый TG / нет, роль | низкая |
| **AuthPage** | Вход/регистрация email+пароль, Google, SMS, подтверждение кода | email login/register, sms login, verify code, resend countdown | высокая (много состояний) |
| **DishFormPage** | Создание/редактирование рецепта в двух режимах (Быстро / Расширенно) | create / edit, quick / advanced, upload in progress | очень высокая (589 строк) |

### 🟣 Приоритет 3 — служебные переходники

Простые экраны, можно обновить в конце или оставить.

| Страница | Что делает |
|---|---|
| **InvitePage** | Принятие инвайта по токену |
| **TelegramAuthPage** | One-time login из бота |

---

## 2. Общие повторяющиеся элементы

Это то, что встречается на 3+ страницах и **должно стать частью дизайн-системы**, а не переделываться каждый раз.

### Layout / Shell

- **Верхний header** (Layout.jsx): лого + «Моя кухня», справа — колокольчик (TODO, не реализован) + аватар или «Войти». Ширина `max-w-app` (430px).
- **Bottom tab bar** (4 таба для authed: Главная / Блюда / Холодильник / План; 2 для гостя). Активный таб — accent-цвет.
- **ProfileModal** — открывается по клику на аватар, список пунктов (мои группы, создать, telegram, профиль, выйти).

### Paddings / отступы

- Горизонтально: у большинства — `px-4`, у HomePage — `px-5`, в артефакте v2 — `px-5`. **Надо унифицировать → `px-5`** (16–20px).
- Вертикально секции: от `mb-3` до `mb-7`. **Надо унифицировать → `mt-7/mt-8` между крупными секциями**.

### Повторяющиеся UI-паттерны

| Паттерн | Где встречается | Текущий вид |
|---|---|---|
| **FAB (добавить)** | DishesPage, FridgePage, DishDetailPage | `w-13 h-13` круг accent со svg-иконкой, `bottom-[76px]`/`bottom-6` right-4 |
| **Chip-фильтр (toggle)** | DishesPage (QuickFilters), HomePage (MealType), DishDetailPage (теги) | 3 разных стиля — sage/accent/border |
| **Empty state** | Все, где есть списки | `<EmptyState>` с emoji + title + description + CTA. Emoji пока текстовые |
| **Guest CTA блок** | HomePage, FridgePage, MealPlanPage, DishesPage, ChatPage | Карточка с заголовком + описанием + двумя кнопками (register / login) — 5 разных реализаций! |
| **Skeleton loading** | HomePage, DishesPage | Разные паттерны, не унифицированы |
| **SearchInput** | DishesPage, FridgePage | Компонент есть — `components/ui/SearchInput` |
| **Button variants** | Везде | `Button` с `variant: primary/secondary/ghost`, `size: sm/md` |
| **Modal** | FridgePage (picker), Layout (profile), AddToPlanModal, BulkAddModal | Компонент есть — `components/ui/Modal` |
| **Avatar-инициал** | Layout, ProfilePage, ProfileModal, CommentsSection | `<Avatar>` компонент, size sm/md/lg |
| **Section label uppercase** | FridgePage, GroupsPage, MealPlanPage, ProfilePage | `text-2xs font-bold text-text-2 uppercase tracking-widest` |
| **Inline quantity editor** | FridgePage | Только там |
| **Day/date header** | MealPlanPage | Только там |
| **Toast** | Везде | `useToast` хук |
| **Однократный hint** | HomePage, DishesPage | `useHintDismiss` хук + закрываемая карточка |

### Несогласованности, которые видны сразу

1. **Guest CTA — 5 разных реализаций.** HomePage (кастомный `GuestHeroBanner`), FridgePage (`GuestFridgeBlock` → `EmptyState`), MealPlanPage (`GuestMealPlanBlock` → `EmptyState`), ChatPage (свой блок), DishesPage (в `RecipesEmptyState`). **Надо сделать один `GuestBlock` компонент.**
2. **Радиусы:** `rounded-sm` (12px — FridgePage, ChatPage input), `rounded-xl`, `rounded-2xl` (16px), `rounded-[14px]`, `rounded-full`. Артефакт v2 использует: `rounded-full` для pills, `rounded-2xl`/`rounded-[14px]` для карточек, `rounded-xl` для sub-блоков. **Надо зафиксировать 4 радиуса: pill (full) / card (14–16) / input (12) / chip (full).**
3. **Типы заголовков:** h1 на HomePage — `text-[26px] font-semibold`, на DishesPage — `text-[22px]`, на MealPlanPage — `text-[22px] font-extrabold font-serif`, на GroupsPage — `text-[22px] font-semibold`. Артефакт v2 — `text-[26px] font-extrabold`. **Надо унифицировать h1 = 26px/extrabold.**
4. **Эмодзи vs SVG.** FridgePage заголовки категорий — emoji (🥛 Молочное). EmptyState — emoji. MealPlanPage — emoji (📅). TASKS.md говорит «все эмодзи в навигации/иконках заменены на SVG» — но в контенте они остались. **Надо решить: оставляем emoji в контенте или тоже переводим.** (Моё мнение: в контексте еды emoji — тёплые, оставить, но привести в порядок — один стиль).
5. **FAB позиция:** `bottom-[76px]` vs `bottom-6` vs `fixed bottom-6 right-4`. Артефакт v2 — pill `bottom-6 right-6`. **Надо зафиксировать: pill-FAB, bottom-20 (выше tab bar) right-4.**
6. **Иконки меты:** круглая button-pill vs floating svg. Артефакт v2 — pill на фото с backdrop-blur. **Надо зафиксировать 2 стиля: on-hero (white/95 backdrop-blur) и on-light (white + shadow-sm).**
7. **Кнопки отправки:** квадратная 40px (DishesPage ChatPage), круглая 32/40 (артефакт v2 accent ArrowUp). **Надо зафиксировать: круглая accent 32px с ArrowUp — используется в inputе комментария в v2.**

---

## 3. Компоненты, которые понадобится вынести или переделать

### Уже есть в `components/ui/`:

- `Button` (primary / secondary / ghost + sm/md + loading)
- `TextInput`, `SearchInput`
- `Modal` (полноэкранный bottom-sheet / overlay)
- `Avatar` (sm/md/lg с инициалом)
- `EmptyState` (icon + title + description + action)
- `Card`, `Loader`, `Toast`, `useToast`, `InstallPrompt`

### Уже есть в `components/domain/`:

- `DishCard` (variants: grid, row, inline) — 275 строк, используется на 5+ страницах
- `DishList`, `IngredientList`, `DishSteps`, `DishMeta`, `CommentsSection`, `MealTypeChips`, `PlanItem`, `GroupCard`, `GroupHeader`
- `AddToPlanModal`, `BulkAddModal`, `OnboardingModal`, `DishIngredientPicker`

### Что стоит добавить / переделать:

- **`GuestBlock`** — единый блок «зарегистрируйся». Разные варианты: inline (баннер в списке), full (на весь экран), inline-small. Убрать 5 дубликатов.
- **`Chip`** — один компонент со штатами: primary (accent-muted + border), success (sage-muted), neutral (white + border). Варианты: solid (filled), outline.
- **`FAB`** — унифицированная pill-кнопка с иконкой + опциональным label.
- **`SectionHeader`** — заголовок секции с опциональным hint'ом под ним и опциональной кнопкой справа (как в артефакте v2: `h2` + `12px hint` + `toggle chip`).
- **`PageHeader`** — h1 + опциональная кнопка/Button справа (унифицирует верхний блок большинства страниц).
- **`HintBanner`** — однократный hint (закрываемая карточка). Уже есть паттерн + `useHintDismiss`, но UI не вынесен.
- **`LoadingSkeleton`** — для списков (row / card / plan-item).
- **`DishCard`** — **возможно нужна 4-я variant** «similar» (168×120 с pill-badge времени, как в артефакте v2). Либо менять текущие variants.

---

## 4. Дизайн-фишки из DishDetailPageV2 → применить везде

Вот конкретные решения из нового варианта детальной страницы, которые стоит разнести по другим экранам, чтобы получился единый стиль:

1. **Pill-кнопка с иконкой+label** (меню-фильтр/FAB) — `h-[40-52px]`, `rounded-full`, accent-цвет, тень `rgba(196,112,74,0.45)`. Для FAB — «+ Добавить блюдо» вместо просто «+». Для фильтра ингредиентов — «не хватает 3» вместо иконки.
2. **Чек-бокс sage-квадрат** — `w-5 h-5 rounded-md`, sage-border или sage-fill с белым чеком. Используется в ингредиентах, может применяться в picker'е холодильника и bulk-add.
3. **Мета-полоска white + border** — 4 метрики в ряд с тонкими dividers. Применимо: на HomePage как "сводка дня" (К завтраку / Обеду / Ужину / Перекусу), на ProfilePage как метрики (любимых: X / рецептов: Y / в плане: Z).
4. **Pinned-плашка** — `bg rgba(accent, 0.06) + border rgba(accent, 0.2) + rounded-xl + pin-иконка`. Применимо: закреплённые блюда в планировщике, первое блюдо в рекомендациях ИИ.
5. **Category-chip vs tag-chip** — primary в accent-muted, secondary в white + border. Применимо: на всех фильтрах (DishesPage, HomePage MealTypeChips).
6. **Photo indicator (dots)** — активная точка-пилюля 20×6, остальные 6×6. Применимо: image slider в DishCard при наведении, onboarding.
7. **Avatar-инициал в `bg-bg-3 + border-border + text-accent`** — применимо в CommentsSection, ProfileModal, GroupsPage (участники).
8. **Inline-инпут-pill с accent-круглой кнопкой отправки** — для комментариев, для chat input (заменит квадратную 40×40 в ChatPage), для "вступить по коду" в GroupsPage.
9. **Сводная sage-плашка** — `rgba(92,122,89,0.08)` + sage-текст. «В холодильнике есть 5 из 8» — применимо в карточке дня в MealPlanPage («Готово 2 из 3»), FridgePage («Общий с семьёй»).
10. **Разноцветные точки на метриках КБЖУ** — 4 цвета (accent / sage / gold / purple). Может применяться где угодно как акцент на метрике, чтобы не делать всё одним accent.

---

## 5. План итераций

**Итерация 0 — фиксируем систему (сейчас)**

1. ✅ Этот аудит (`redesign-plan.md`)
2. 📝 Дизайн-система (`design-system.md`) — один файл с токенами, шаблонами компонентов, правилами. На основе артефакта v2 + этих наблюдений.

**Итерация 1 — ядро**

По одной странице в claude.ai/design с коротким брифом (т.к. система уже зафиксирована):

1. **HomePage** — «что готовить сегодня» + мета-полоска + quick actions
2. **DishesPage** — каталог + unified фильтры (pill-стиль)
3. **FridgePage** — список продуктов + picker-modal + inline-редактор
4. **ChatPage** — bubbles + inline-карточки + новый input-pill
5. **MealPlanPage** — карточки дней + pinned-плашка для «сегодня»

**Итерация 2 — поддерживающие**

6. **ProfilePage** — карточка профиля + мета-полоска (метрики)
7. **GroupsPage + GroupDetailPage** — карточки групп + участники-аватары
8. **AuthPage** — этапный flow
9. **DishFormPage** — форма в двух режимах (больше всего работы)

**Итерация 3 — перенос в код**

- Вынести общие компоненты в `components/ui/`
- Заменить `EmptyState`, `GuestBlock`, добавить `Chip`, `FAB`, `SectionHeader`, `HintBanner`
- Постранично переписать (либо side-by-side через `?v=2`, либо ветка)
- Обновить `frontend-rules.md` в `context/`

**Итерация 4 — зачистка**

- Удалить дубликаты guest-блоков
- Удалить неиспользуемые классы/варианты
- Прогнать через `context/audits/` — записать результаты в новый аудит

---

## 6. Открытые вопросы

1. **Servings (порции)** — добавляем поле в БД или прячем из UI? (Для DishDetailV2 уже решение — прячем.)
2. **Эмодзи в контенте** — оставляем (🥛 Молочное, 📅 Планируй) или заменяем на SVG?
3. **Колокольчик в хедере** — пока заглушка без функционала. Делать уведомления или убрать кнопку до реализации?
4. **DishCard** — переделываем текущие variants или добавляем новую «similar» для секции «Попробуй также»?
5. **Мультиязычность (EN)** из бэклога — закладываем структуру при редизайне или игнорим?
6. **Dark mode** — в планах нет, но стоит ли при редизайне оставить задел?
7. **Монетизация (Pro)** — есть ли в ближайших планах? Если да, то UI надо предусмотреть «Только для Pro» бейджи.

---

## Что дальше

Когда прочитаешь, напиши:
- Какой приоритет страниц меняем (и меняем ли)
- Ответы на открытые вопросы (хотя бы 1, 2, 3 — они влияют на систему)
- Готова ли идти дальше к `design-system.md`
