# MealBot — Дизайн-система (Redesign v2)

_Единый источник правды для редизайна. Основана на артефакте `dish-detail-v2.jsx` и аудите `redesign-plan.md`._

**Принципы:**
- Тёплая, «домашняя» палитра (беж + терракот + оливковый). Не иОS, не Material.
- Плотная типографика с крупными заголовками (Nunito Extrabold).
- Круглые pill-кнопки для действий, мягкие rounded-quad для карточек и шагов.
- Воздух между секциями важнее разделителей.
- Моб-first под 375–430px.

---

## 1. Токены цвета

Все цвета зафиксированы в `frontend/tailwind.config.js` — используем **именованные токены** в классах, **не hex**.

| Роль | Токен | Hex | Где |
|---|---|---|---|
| Фон страницы | `bg-bg` | `#F6F4EF` | `<body>`, основной фон |
| Фон карточек | `bg-white` (`bg-bg-2`) | `#FFFFFF` | карточки, белые плитки |
| Фон мягкий | `bg-bg-3` | `#F5EFE6` | инпуты, avatar-инициал, сводка |
| Бордер | `border-border` | `#E5D8C8` | все рамки |
| Бордер полупрозрачный | `border-border/60` | — | секции, тонкие divider'ы |
| Акцент | `bg-accent` / `text-accent` | `#C4704A` | primary-CTA, FAB, активные состояния |
| Акцент-светлый | `bg-accent-muted` | `rgba(196,112,74,0.1)` | badges, step-numbers, pinned |
| Sage (успех) | `bg-sage` / `text-sage` | `#5C7A59` | «в холодильнике», success-плашки |
| Sage-muted | — (inline `rgba(92,122,89,0.08)`) | — | сводка по холодильнику |
| Text | `text-text` | `#1C1917` | основной текст |
| Text-2 | `text-text-2` | `#78716C` | вторичный |
| Text-3 | `text-text-3` | `#A8A29E` | подсказки, метаданные |
| Destructive | `text-red-400` (tailwind) | — | удаление, ошибки |

**КБЖУ-специфичные** (4 акцентных цвета для метрик — inline hex):
- Калории — `text-accent` (`#C4704A`)
- Белки — `text-sage` (`#5C7A59`)
- Жиры — `#D4A441` (gold, добавить в config как `nutrition-fat`)
- Углеводы — `#8C6D9E` (purple, добавить как `nutrition-carbs`)

**Pro-специфичные** (для монетизации):
- Pro-акцент — `#B8935A` (тёплое золото) — добавить в config как `pro` / `pro-muted`
- Используется для бейджей «Только для Pro», апгрейд-баннеров

---

## 2. Типографика

Шрифт — **Nunito** (sans/serif — один и тот же, оба через font-sans).

| Роль | Размер | Вес | Tailwind |
|---|---|---|---|
| H1 страницы | 26px / 1.2 | `font-extrabold` | `text-[26px] font-extrabold leading-tight tracking-tight` |
| H1 внутри hero | 22–26px | `font-bold` | `text-[22px] font-bold` (белый на фото) |
| H2 секция | 17px | `font-bold` | `text-[17px] font-bold tracking-tight` |
| H3 sub-секция | 15px | `font-bold` | `text-[15px] font-bold` |
| Body | 14–15px | `font-normal` / `font-medium` | `text-[14.5px] leading-relaxed` |
| Small | 13px | `font-medium` | `text-[13px]` |
| Meta/hint | 12px | `font-normal` / `font-semibold` | `text-[12px]` |
| 2xs | 10–11px | `font-semibold` / `font-bold` | `text-2xs` (есть в config) или `text-[11px]` |
| Uppercase label | 10–11px | `font-semibold uppercase tracking-wide` | label под H2: «на 4 шага», «на порцию» |

**Tabular-nums** — для чисел (КБЖУ, время, количество): `tabular-nums`.

**Замечание:** надо добавить в `tailwind.config.js` фиксированные размеры `text-sm2` (13px), `text-md2` (15px), `text-lg2` (17px) — чтобы не было `text-[13px]` разбросано везде. Но пока используем arbitrary — переведём на этапе переноса.

---

## 3. Радиусы

Только 4 радиуса по всей системе:

| Размер | Где | Tailwind |
|---|---|---|
| `full` (pill) | кнопки, chip'ы, avatar, FAB, photo-indicators, inline-input | `rounded-full` |
| `xl` (14–16px) | карточки, inputs, плитки КБЖУ, шаги, pinned-блок | `rounded-2xl` (16px) или `rounded-[14px]` |
| `md` (12px) | sub-блоки, sage-сводка, чек-бокс | `rounded-xl` (12px) |
| `sm` (8px) | мелкие бейджи, счётчики | `rounded-lg` (8px) |

**Не использовать:** `rounded-sm`, `rounded`, `rounded-DEFAULT` — это legacy, на переписывании заменим.

---

## 4. Тени

| Роль | Где | Tailwind |
|---|---|---|
| Мягкая (карточка) | hero-badges (circle buttons), карточки-блюда | `shadow-sm` |
| Средняя | FAB label (inline) | `shadow-md` |
| Accent-glow | FAB | `shadow-accent` (`0 4px 16px rgba(196,112,74,0.35)`) — или inline `0 8px 24px rgba(196,112,74,0.45)` |
| Top (bottom sheet) | ActionsMenu, Modal снизу | `shadow-top` |

---

## 5. Отступы и layout

### Контейнер

- Ширина: `max-w-app` (`430px`) — центрируется через `mx-auto`.
- Горизонтальные паддинги: **`px-5`** (20px) — унифицируем, раньше было `px-4`/`px-5` хаотично.
- Нижний отступ страницы: `pb-24` (для FAB + tab bar).

### Секции

- Между крупными секциями: `mt-7` (28px) или `mt-8` (32px) для визуально важных переходов.
- Внутри секции, между header и контентом: `mb-3` (12px).
- Между элементами списка: `gap-3.5` (14px) для карточек, `gap-2.5` для строк.

### Header секции

Паттерн, повторяется везде (см. компонент `<SectionHeader>` ниже):

```
<h2>Заголовок</h2>               ← text-[17px] font-bold
<div>на 4 шага / на порцию</div>  ← text-[12px] text-text-3 mt-0.5
[опциональный chip/button справа]
```

---

## 6. Компоненты (спецификации)

### 6.1. Button

Три варианта, два размера. Базовый `components/ui/Button.jsx` уже существует — **дополнить**, не ломая API.

| Variant | Фон | Текст | Бордер | Тень |
|---|---|---|---|---|
| `primary` | `bg-accent` | `text-white` | — | `shadow-accent` |
| `secondary` | `bg-white` | `text-text` | `border-border` | `shadow-sm` |
| `ghost` | transparent | `text-text-2` | — | — |
| `success` (новое) | `bg-sage` | `text-white` | — | — |
| `destructive` (новое) | transparent | `text-red-400` | `border-red-300` | — |
| `pro` (новое) | `bg-pro` | `text-white` | — | — |

Размеры:
- `sm`: `h-9 px-4 text-[13px] rounded-full`
- `md` (default): `h-11 px-5 text-[15px] rounded-full`
- `lg`: `h-13 px-6 text-[15px] rounded-full font-bold`

**Важно:** все кнопки — **pill (`rounded-full`)**. Квадратных CTA больше нет.

### 6.2. FAB

Два размера, одна семантика — accent pill с иконкой + опциональным label.

```jsx
<FAB icon={<PlusIcon />} label="Добавить блюдо" onClick={...} />
```

- Позиция: `fixed bottom-20 right-4` (над tab bar 64px + safe-area).
- Размер: `h-[52px] px-5`, icon 18px, gap-2.
- Фон: `bg-accent`, тень `shadow-accent`.
- Текст: `text-[14.5px] font-bold text-white`.
- Без label — круглый: `w-13 h-13 rounded-full`.

**Правило:** когда есть место для label — используем label. На мобильном при загруженном экране — без label.

### 6.3. Chip

Три семантики × два состояния (active/inactive).

```jsx
<Chip variant="primary" active={true}>Завтрак</Chip>
<Chip variant="neutral">#быстро</Chip>
<Chip variant="success">Есть в холодильнике</Chip>
```

| Variant | Active | Inactive |
|---|---|---|
| `primary` | `bg-accent-muted border-accent/25 text-accent font-bold` | `bg-white border-border text-text-2` |
| `neutral` (теги) | — | `bg-white border-border text-text-2 font-semibold` |
| `success` | `bg-sage/12 border-sage/30 text-sage font-bold` | — |

Базовые классы: `px-3 py-1.5 rounded-full text-[12.5px] border inline-flex items-center gap-1.5`.

### 6.4. SectionHeader

```jsx
<SectionHeader
  title="Ингредиенты"
  subtitle="на 4 порции"
  right={<Chip>...</Chip>}
/>
```

- title: `text-[17px] font-bold tracking-tight`
- subtitle: `text-[12px] text-text-3 mt-0.5`
- right-slot: любой элемент, выравнивается по правому краю.

### 6.5. PageHeader

Для верхней части страницы (Home/Dishes/Fridge/...).

```jsx
<PageHeader
  title="Мои блюда"
  right={<Button size="sm">+ Создать</Button>}
/>
```

- title: `text-[26px] font-extrabold leading-tight`
- отступы: `px-5 pt-5 pb-2`

### 6.6. Card (карточка)

```jsx
<Card className="...">
  ...
</Card>
```

- Base: `bg-white rounded-2xl border border-border`
- Padding: варьируется по контексту (`p-4` / `p-5`).
- Без shadow по умолчанию (бордер достаточно). Shadow — только если карточка выделяется (hero-banner, FAB).

### 6.7. Avatar (инициал)

Уже есть `components/ui/Avatar.jsx` — **заменить стиль**:

- Фон: `bg-bg-3` (было — разные цвета).
- Бордер: `border border-border`.
- Текст: `text-accent font-bold`.
- Размеры: `sm` (26px), `md` (32px), `lg` (40px), `xl` (56px — для ProfilePage).

### 6.8. Inline-pill input

Для комментариев, chat-input, «вступить по коду».

```jsx
<PillInput
  value={...}
  onChange={...}
  placeholder="..."
  onSubmit={...}        // enter или клик по кнопке
  disabled={...}
  maxLength={...}
/>
```

- Контейнер: `flex items-center gap-2 bg-white rounded-full border border-border pl-4 pr-1.5 py-1.5`
- input: `flex-1 bg-transparent outline-none text-[14px]`
- Кнопка: круглая accent 32px (`w-8 h-8 rounded-full bg-accent text-white`), иконка ArrowUp 16px
- Disabled-state кнопки: `bg-border cursor-not-allowed`

### 6.9. GuestBlock

Заменяет 5 разных реализаций. Два варианта:

**full** (EmptyState с guest-CTA, на весь контейнер):
```jsx
<GuestBlock
  icon="🧊"
  title="Готовь из того, что есть дома"
  description="Добавь продукты..."
/>
```

**banner** (вставляется в flow, закрываемый, с `useHintDismiss`):
```jsx
<GuestBlock variant="banner" dismissKey="home_banner" />
```

Оба варианта ведут на `/auth?mode=register` и `/auth`. Жёстко прошиты — не нужно передавать тексты кнопок.

### 6.10. HintBanner

Однократно закрываемая подсказка:

```jsx
<HintBanner dismissKey="bulkAdd_seen">
  Используй <strong>Добавить несколько блюд</strong> — можно перечислить через запятую
</HintBanner>
```

- Контейнер: `bg-white rounded-2xl px-4 py-3 flex items-start gap-3 shadow-sm`
- Кнопка-крестик справа: `w-6 h-6 text-text-3`
- Использует существующий `useHintDismiss`

### 6.11. MetaStrip (мета-полоска)

Горизонтальная белая карточка с 3–4 метриками и разделителями. Паттерн из DishDetailV2.

```jsx
<MetaStrip items={[
  { icon: <ClockIcon />, value: 30, unit: 'мин', label: 'время' },
  { icon: <ChefHatIcon />, value: 'Легко', label: 'сложность' },
  { icon: <FlameIcon />, value: 485, unit: 'ккал', label: 'ккал' },
]} />
```

- Контейнер: `bg-white rounded-2xl border border-border px-2 py-3.5 flex`
- Каждый item: `flex-1 flex flex-col items-center gap-1` + divider между
- Icon: 17px, `text-accent`

### 6.12. CheckRow (ингредиент с чек-боксом)

Для списка ингредиентов и picker'а холодильника.

```jsx
<CheckRow
  checked={true}
  label="Паста (пенне)"
  meta="400 г"
  dim={false}
/>
```

- Чек-бокс: `w-5 h-5 rounded-md`, sage fill когда checked, white с border-border когда нет.
- Label: `text-[14px] font-semibold`
- Meta: `text-[12px] text-text-3 tabular-nums mt-0.5`

### 6.13. StatusBadge (Pro-бейдж и подобные)

```jsx
<StatusBadge variant="pro">Только для Pro</StatusBadge>
<StatusBadge variant="family">Семейный</StatusBadge>
<StatusBadge variant="pinned"><PinIcon />закреплено</StatusBadge>
```

Базовый: `inline-flex items-center gap-1 text-2xs font-bold uppercase tracking-wide rounded-full px-2 py-0.5`

- `pro`: `bg-pro-muted text-pro`
- `family`: `bg-sage/12 text-sage`
- `pinned`: `bg-accent-muted text-accent`

---

## 7. Иконки

**Переход на `lucide-react`** (уже используется в артефакте). Убираем inline SVG из страниц — переносим в lucide.

**Исключения** — оставляем inline-SVG только где нужен нестандартный пиктографический стиль:
- Логотип приложения
- Холодильник-иконка в хедере и tab bar (своя, с точечками)
- Tab bar иконки (всё inline — так быстрее)

**Размеры:** 14 (в chip'ах), 16 (в бейджах, меню), 18 (в кнопках, inputs), 20 (в заголовках, hero-кнопках), 24 (tab bar).

---

## 8. Состояния

### Loading

**Skeleton вместо spinner'а** для списков:
- row-skeleton: `h-[76px] bg-white rounded-2xl animate-pulse border border-border`
- card-skeleton: `h-[180px] bg-white rounded-2xl animate-pulse`

Spinner — только для inline-действий (кнопка в состоянии loading, подгрузка при infinite scroll).

### Empty

Стандартный `<EmptyState>`:
- Иконка в круге bg-bg-3 (56px) + emoji или lucide-icon
- Заголовок 15px bold
- Описание 13px text-2
- CTA-кнопка (опционально)

### Error

Inline-error:
- `text-red-400 text-[13px] mt-2` + иконка AlertCircle
- Для критичных — modal с кнопкой «Попробовать снова»

---

## 9. Мультиязычность (i18next)

### Стек

- Пакет: `react-i18next` + `i18next` + `i18next-browser-languagedetector`
- Структура: `frontend/src/locales/{ru,en}/{common,dish,fridge,auth,...}.json`
- Стартовый язык: `ru` (fallback).
- Detector: сначала `localStorage.mealbot_lang`, потом `navigator.language`.

### Правила использования

- Все строки UI → `t('key')`.
- **Не хардкодим** русский текст в jsx, кроме вариантов: названия блюд/ингредиентов (они из БД), placeholder-демо.
- Namespace = секция: `dish`, `fridge`, `auth`, `common` (общие кнопки), `errors` (сообщения об ошибках).
- Плюрализация — через `t('plural_key', { count: 5 })` — i18next умеет русские падежи.
- На этапе переноса — прохожу по страницам и выношу строки в локали.

### Пример

```json
// locales/ru/dish.json
{
  "title": "Ингредиенты",
  "subtitle_servings": "на {{count}} порции",
  "fridge_summary": "В холодильнике есть {{have}} из {{total}}",
  "missing_count": "не хватает {{count}}"
}
```

```jsx
import { useTranslation } from 'react-i18next'
const { t } = useTranslation('dish')
<h2>{t('title')}</h2>
<div>{t('subtitle_servings', { count: 4 })}</div>
```

### Что сделаем в рамках редизайна

1. Установить пакеты: `npm i react-i18next i18next i18next-browser-languagedetector`.
2. Создать `frontend/src/i18n.js` с конфигом + импорт в `main.jsx`.
3. Создать `locales/ru/*` с начальными namespaces.
4. На каждой переписываемой странице — сразу выносим строки в локаль (не хардкодим).

EN-переводы создадим позже отдельным проходом — сейчас оставляем только ru.

---

## 10. Монетизация (Pro)

### UI-маркеры

- **Бейдж `<StatusBadge variant="pro">Pro</StatusBadge>`** — рядом с фичами, доступными только Pro.
- **Блок-овер** (блюдо/фича недоступна): размытая карточка + центрированный CTA «Разблокировать с Pro».
- **Цвет:** тёплое золото `#B8935A` (чтобы отличить от accent).

### Где предусмотреть в редизайне

- **ChatPage:** если лимит исчерпан, показывать upgrade-CTA «Pro — безлимит».
- **DishFormPage:** при «кастомном ингредиенте» (из TASKS.md — Pro-only) — поле с бейджем Pro.
- **FridgePage:** кнопка «Распознать чек» (Pro-only) — с бейджем + блюр если не Pro.
- **ProfilePage:** блок «Ваш план» с кнопкой Upgrade если не Pro.

### Структура кода

- В store: `user.role` уже есть (`USER` / `PRO` / `ADMIN`). Используем как условие.
- Helper: `isPro(user)` → `user?.role === 'PRO' || user?.role === 'ADMIN'`
- Компонент: `<ProGate feature="...">...</ProGate>` — оборачивает контент, показывает overlay если не Pro.

Реализация `<ProGate>` — на этапе переноса, не сейчас.

---

## 11. Темы и dark mode

**Не делаем.** Только светлая тема. `@media (prefers-color-scheme: dark)` игнорируем.

---

## 12. Side-by-side стратегия переноса

Чтобы можно было откатиться в любой момент:

### Вариант A — роутинг (предпочтительный)

Новые страницы на параллельных роутах:
```
/dishes/:id          → DishDetailPage (старая)
/dishes/:id?v=2      → DishDetailPageV2 (новая)

или

/v2/dishes/:id       → новая
```

В `App.jsx` добавляем роут, в старой странице — кнопку «Попробовать новый дизайн» (в меню три точки). После проверки — меняем главный роут.

### Вариант B — feature flag

```js
// frontend/src/featureFlags.js
export const REDESIGN = localStorage.getItem('mealbot_redesign') === '1'
```

Переключается руками через консоль: `localStorage.setItem('mealbot_redesign', '1')`.

Плюс: не надо дублировать роуты.
Минус: сложнее показать кому-то без лишних шагов.

**Выбираем A** — понятнее и проще откатить (просто убрать новые роуты).

### Ветка

Вся работа — в ветке **`redesign`**. Main не трогаем до полной готовности.

После готовности:
- Открываем PR `redesign` → `main`.
- Merge — только после ручной проверки всех состояний.
- Если что-то сломалось на проде — `git revert <merge-commit>` или переключаем nginx на предыдущий build.

---

## 13. Что прямо сейчас пойдёт в код

На первом этапе переноса:

1. `frontend/tailwind.config.js` — добавить:
   - `colors.accent-muted`, `colors.sage-muted`
   - `colors.pro`, `colors.pro-muted`
   - `colors.nutrition-fat`, `colors.nutrition-carbs`
   - `fontSize.sm2` (13px), `fontSize.md2` (15px), `fontSize.lg2` (17px)
2. `frontend/src/components/ui/` — новые компоненты:
   - `FAB`, `Chip`, `SectionHeader`, `PageHeader`, `PillInput`, `GuestBlock`, `HintBanner`, `MetaStrip`, `CheckRow`, `StatusBadge`
   - Обновить `Button` (добавить variants success/destructive/pro, унифицировать на pill)
   - Обновить `Avatar` (новые цвета)
3. `frontend/src/i18n.js` + `locales/ru/*.json`
4. `frontend/package.json` — i18next пакеты
5. Редизайн страниц по очереди с `V2`-суффиксом и параллельными роутами

---

## 14. Чек-лист для каждой новой страницы

При переносе страницы в новый дизайн проверять:

- [ ] Все строки вынесены в `locales/ru/<page>.json`, нигде нет хардкода русских слов
- [ ] Используются только токены из config, нет inline hex (кроме 4 цветов КБЖУ и pro-цвета)
- [ ] Отступы: `px-5` горизонтально, `mt-7/8` между секциями
- [ ] Заголовки: H1=26px/extrabold, H2=17px/bold
- [ ] Кнопки pill (`rounded-full`)
- [ ] Chip используются из `<Chip>`, не inline
- [ ] Guest-состояние через `<GuestBlock>`
- [ ] Empty-состояние через `<EmptyState>`
- [ ] Loading — skeleton для списков, spinner только inline
- [ ] Pro-фичи обёрнуты в `<StatusBadge variant="pro">` или `<ProGate>`
- [ ] SVG-иконки — из `lucide-react`, inline только tab-bar/logo
- [ ] Работает на 375px (iPhone SE) и 430px (Pro Max)

---

## 15. Что не попало сюда (осознанно)

- **Анимации/transitions:** оставляем существующие (`fade-in`, `fade-up`). Не усложняем.
- **Жесты:** свайп-назад, pull-to-refresh — не добавляем.
- **Онбординг-тур:** оставляем `OnboardingModal` как есть.
- **Accessibility:** базовый уровень — `aria-label` на кнопках-иконках, focus-outline. Полный a11y-аудит — отдельной задачей после редизайна.

---

**Статус:** draft v1. Корректируем по мере переноса страниц.
