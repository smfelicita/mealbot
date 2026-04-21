# ТЗ для claude.ai/design — FridgePage (Холодильник)

Страница управления холодильником. Список продуктов с группировкой, inline-редактор количества, picker-модалка для добавления, Telegram-баннер, FAB.

---

## Промпт для claude.ai/design

Создай React-артефакт (`.jsx`) — страница холодильника мобильного PWA MealBot.

### Общие правила артефакта (важно!)

- **Не рисуй header (52px сверху) и tab bar (64px снизу)** — они есть отдельно в Layout'е приложения. Нарисуй только контент страницы. Внизу оставь `pb-24` отступ — там будет tab bar.
- **Токены цвета** собери в единый объект `C = { bg, card, bg3, border, accent, accentMuted, accentBorder, sage, sageMuted, sageBorder, text, text2, text3 }` в начале файла.
- **Отступы:** горизонтально везде `px-5` на корневом wrapper'е страницы (не `mx-5` на каждой секции). Между секциями — **`mt-7` (28px)**.
- **Заголовки:** без принудительных `<br />`. Используй `textWrap: 'pretty'` / `'balance'`.
- **Числа:** `tabular-nums` для количества (200 г, 3 шт) и метрик.
- **Avatar залогиненного юзера** (если встретится): `bg-bg-3 border border-border text-accent font-bold`.
- **MetaStrip:** каждая метрика = **иконка 16-17px text-accent + value + label** (иконка обязательна).
- **Structure:** именованные компоненты с `// ═══ ... ══════` шапками. Один `Screen` с пропом `variant` ('empty' | 'full' | 'picker').

### Контекст

Пользователь ведёт список того что у него есть дома. Система использует этот список для подбора блюд «из того что есть». Сценарий: «открыл → увидел что есть → добавил новое через picker → или указал количество у существующего».

Ключевые фичи:
- Продукты сгруппированы по категориям (Молочное, Белки, Овощи, Фрукты, Злаки, Мясо, Специи, Зелень, Масла, Кладовая, Бобовые, Остальное)
- У каждого продукта можно указать количество (значение + единица: г, кг, мл, л, шт, ст.л., ч.л.)
- Некоторые продукты помечены как «базовые» (соль, перец, масло) — они всегда считаются в наличии при подборе блюд
- Если пользователь в FAMILY-группе — холодильник общий с семьёй (sage-маркер)
- Баннер-CTA на подключение Telegram-бота (если не подключён)
- Picker-модалка: поиск + группированные chip'ы, multi-select, кнопка «Добавить N продуктов»

### Ограничения

Как обычно: мобильный first, одиночный `.jsx`, Tailwind core + hex inline, `lucide-react`, `useState`.

Иконки: Refrigerator, Search, Plus, X, Check, Sparkles, Trash2, Users, Edit3, MessageCircle (для Telegram — или inline SVG).

### Дизайн-система (reference)

Цвета: `#F6F4EF` / `#FFFFFF` / `#F5EFE6` / `#E5D8C8`. Акцент `#C4704A`, accent-muted `rgba(196,112,74,0.1)`. Sage `#5C7A59`, sage-muted `rgba(92,122,89,0.08)`. Text `#1C1917`/`#78716C`/`#A8A29E`. Nunito.

Радиусы: pill для кнопок/chip, rounded-2xl для карточек, rounded-xl для sub, rounded-lg для мелких бейджей.

Типографика: H1=26px extrabold, H2=17px bold, label uppercase 10-11px tracking-wide text-2.

Кнопки pill. Chip primary-active = `bg-accent-muted border-accent/25 text-accent`. Success chip = `bg-sage/12 border-sage/30 text-sage`.

Отступы `px-5`, секции `mt-7/8`.

### Состояния экрана

В одном артефакте **три состояния**:

1. **Пустой холодильник** — empty state + CTA
2. **Полный рабочий вид** (с FAMILY-маркером, с telegram-баннером, с editing inline у одного продукта)
3. **Picker-модалка открыта** (внутри фрейма — оба состояния: поиск и группированные chip'ы)

### Данные (мок)

```js
const FRIDGE = [
  // dairy
  { id: 'milk',    name: 'Молоко',    emoji: '🥛', cat: 'dairy',  qty: 1,   unit: 'л' },
  { id: 'cheese',  name: 'Сыр',       emoji: '🧀', cat: 'dairy',  qty: 200, unit: 'г' },
  { id: 'butter',  name: 'Сливочное масло', emoji: '🧈', cat: 'dairy', qty: null, unit: null, basic: true },
  // protein
  { id: 'eggs',    name: 'Яйца',      emoji: '🥚', cat: 'protein', qty: 6, unit: 'шт' },
  // vegetable
  { id: 'tomato',  name: 'Помидоры',  emoji: '🍅', cat: 'vegetable', qty: 4, unit: 'шт' },
  { id: 'onion',   name: 'Лук репчатый', emoji: '🧅', cat: 'vegetable', qty: 2, unit: 'шт' },
  { id: 'cucumber', name: 'Огурцы',   emoji: '🥒', cat: 'vegetable', qty: 3, unit: 'шт' },
  // grain
  { id: 'pasta',   name: 'Паста',     emoji: '🍝', cat: 'grain', qty: 500, unit: 'г' },
  { id: 'rice',    name: 'Рис',       emoji: '🍚', cat: 'grain', qty: 1,   unit: 'кг' },
  // meat
  { id: 'chicken', name: 'Куриное филе', emoji: '🍗', cat: 'meat', qty: 500, unit: 'г' },
  // spice/herb/oil (basic)
  { id: 'salt',    name: 'Соль',      emoji: '🧂', cat: 'spice', basic: true },
  { id: 'pepper',  name: 'Чёрный перец', emoji: '🌶', cat: 'spice', basic: true },
  { id: 'oil',     name: 'Подсолнечное масло', emoji: '🫒', cat: 'oil', basic: true },
  { id: 'garlic',  name: 'Чеснок',    emoji: '🧄', cat: 'herb',  qty: 1, unit: 'шт' },
];

const CAT_META = {
  dairy:     { label: 'Молочное', emoji: '🥛' },
  protein:   { label: 'Белки',    emoji: '🥚' },
  vegetable: { label: 'Овощи',    emoji: '🥕' },
  fruit:     { label: 'Фрукты',   emoji: '🍎' },
  grain:     { label: 'Злаки',    emoji: '🌾' },
  meat:      { label: 'Мясо',     emoji: '🥩' },
  spice:     { label: 'Специи',   emoji: '🌶' },
  herb:      { label: 'Зелень',   emoji: '🌿' },
  oil:       { label: 'Масла',    emoji: '🫒' },
  pantry:    { label: 'Кладовая', emoji: '🥫' },
  legume:    { label: 'Бобовые',  emoji: '🫘' },
  other:     { label: 'Остальное', emoji: '📦' },
};

const AVAILABLE_TO_ADD = [
  { id: 'apple',   name: 'Яблоки',   emoji: '🍎', cat: 'fruit' },
  { id: 'banana',  name: 'Бананы',   emoji: '🍌', cat: 'fruit' },
  { id: 'lemon',   name: 'Лимон',    emoji: '🍋', cat: 'fruit' },
  { id: 'carrot',  name: 'Морковь',  emoji: '🥕', cat: 'vegetable' },
  { id: 'potato',  name: 'Картофель', emoji: '🥔', cat: 'vegetable' },
  { id: 'pepper_v', name: 'Болгарский перец', emoji: '🫑', cat: 'vegetable' },
  { id: 'beef',    name: 'Говядина', emoji: '🥩', cat: 'meat' },
  { id: 'fish',    name: 'Рыба',     emoji: '🐟', cat: 'protein' },
  { id: 'yogurt',  name: 'Йогурт',   emoji: '🥛', cat: 'dairy' },
  { id: 'flour',   name: 'Мука',     emoji: '🌾', cat: 'grain' },
  { id: 'honey',   name: 'Мёд',      emoji: '🍯', cat: 'pantry' },
  { id: 'beans',   name: 'Фасоль',   emoji: '🫘', cat: 'legume' },
];

const UNITS = ['г', 'кг', 'мл', 'л', 'шт', 'ст.л.', 'ч.л.'];
```

### Структура экрана

#### Состояние 1 — Пустой

1. **PageHeader:** H1 «Холодильник» — 26px extrabold.
2. **Empty block** — круг bg-bg-3 (64px) с Refrigerator icon или эмодзи 🧊 внутри, H2 «Холодильник пустой» 17px bold, text-13 text-2 «Добавь продукты — MealBot подберёт что приготовить из того, что есть», primary-кнопка «+ Добавить продукты».

#### Состояние 2 — Полный вид

1. **PageHeader:** H1 «Холодильник»
2. **FAMILY-маркер (если группа):** sage-muted плашка под заголовком — Users icon + «Общий холодильник с семьёй» + username-chip «с 2 участниками». `mt-2 mb-4 rounded-xl px-3.5 py-2.5 text-[13px] text-sage font-semibold`.
3. **Telegram-баннер (если не подключен):** белая карточка с тонкой accent-border, иконка Telegram (inline SVG синий круг или emoji ✈), текст «Управляй холодильником прямо в Telegram», справа `Chip primary` «Подключить». Можно закрыть крестиком.
4. **Мета-полоска:** 3 метрики — «Всего продуктов: 14», «Базовых: 3», «Из них хватает на: 12 блюд» (последнее — sage-подсветка). Стиль как MetaStrip.
5. **Быстрое действие sage:** pill-кнопка во всю ширину `bg-sage text-white` — «✨ Что можно приготовить?» — ведёт в чат с prompt'ом. Под ней мелкий text-3 «ИИ подберёт по холодильнику».
6. **Категории:** для каждой непустой категории:
   - Label uppercase: `🥛 Молочное · 3` — 10–11px font-bold text-2 uppercase tracking-wide mb-2.5
   - Сетка `grid grid-cols-2 gap-2` с карточками продуктов. Карточка продукта: `bg-white border-border rounded-xl p-2.5 flex flex-col`:
     - Верхняя строка: emoji + название (text-13 font-semibold flex-1 truncate) + X-кнопка удаления
     - Нижняя строка бейджей: если `basic` — `Chip 2xs` «базовый» sage-muted, если `qty` — `text-2xs text-3` «200 г»
   - Для одного продукта в состоянии 2 показать inline-редактор количества: input number + select единицы + кнопки ✓/✕ — `flex gap-1.5 mt-2`.
7. **"Очистить" в конце** — мелкая ghost-кнопка text-3 по центру.
8. **FAB:** pill «+ Добавить продукты» accent, bottom-20 right-4.

#### Состояние 3 — Picker-модалка

Bottom-sheet на весь контент (так и нарисуй, но внутри device-фрейма с overlay). Внутри:
- Handle bar сверху
- Заголовок «Что у вас есть?» + крестик справа
- Pill search input («Найти продукт...») + иконка Search
- Если поиск активен — список строк-результатов: emoji + name + `+`/`✓` справа. Выбранные — с accent-muted bg.
- Если поиск пустой — группировка по категориям с chip'ами. Label категории uppercase, chip'ы `flex flex-wrap gap-1.5`. Chip неактивный = `bg-bg-3 border border-border text-text-2 + emoji`, chip активный = `bg-accent-muted border-accent text-accent`.
- Внизу primary-кнопка во всю ширину — «Добавить 5 продуктов» (disabled если 0, тогда label «Готово» secondary).

Показать **два подсостояния** picker-модалки рядом или друг под другом с подписью:
- «Grouped chips (по умолчанию)»
- «Search active (введено "яб")»

### Фишки для этой страницы

- **Чек-бокс-sage для pantry items** — в отличие от detail-page, здесь они уже "в холодильнике", поэтому визуально это «присутствует» (sage), а не «надо купить».
- **Basic-бейдж** — 2xs chip sage-muted «базовый». На этих продуктах также более тёмная accent-рамка карточки — подчёркивает что они важны.
- **Inline-редактор количества** — в контексте карточки расширяется снизу. `flex gap-1.5`. Нужна компактность, чтобы не ломало сетку grid-cols-2.
- **FAMILY-плашка** — sage, не accent, чтобы не конфликтовать с accent-баннером Telegram.
- **Мета-полоска с последним sage-элементом** — показывает ценность (сколько блюд можно приготовить).
- **Sage-кнопка «Что приготовить»** — визуально выделяется из общего accent-языка, подчёркивает что это AI-фича.

### Технические напоминания

- `export default`
- 3 состояния друг под другом
- Picker нарисовать как часть экрана, не как реальный fixed overlay (чтобы видно было в артефакте)
- Моки инлайном

### Не забудь

- Токены цвета — через объект `C` наверху файла
- `px-5` горизонтально на корне страницы, между секциями `mt-7`
- Заголовки без принудительных `<br />`
- `textWrap: 'pretty'` / `'balance'` на заголовках
- `tabular-nums` на числах
- Маленькие именованные компоненты с `// ═══` шапками
- Нижний отступ `pb-24` (под tab bar)
