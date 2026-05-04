# ТЗ для claude.ai/design — DishFormPage (создание/редактирование блюда)

Самая сложная страница в системе: форма с условными полями, два режима (Быстро / Расширенно), мульти-загрузка фото, picker ингредиентов, выбор visibility. Цель — упорядочить визуально и сделать заполнение ощущаться лёгким.

---

## Промпт для claude.ai/design

Создай React-артефакт (`.jsx`) — страница создания и редактирования блюда мобильного PWA MealBot.

### Общие правила артефакта (важно!)

- **Не рисуй tab bar (64px снизу)** — он в Layout'е. Header (52px) — рисуй свой sticky-header с back-кнопкой и кнопкой «Сохранить» (это back-страница, не корневая).
- **Токены цвета** собери в объект `C = { bg, card, bg3, border, accent, accentMuted, accentBorder, sage, sageMuted, sageBorder, text, text2, text3, red }` в начале файла.
- **Отступы:** `px-5` горизонтально на корне. Между секциями — **`mt-7` (28px)**.
- **Заголовки секций** (`Label`): uppercase 10.5–11px tracking-wide text-3, letterSpacing 0.6, mb-2 px-1.
- **Заголовки** в hero/sections: H1 24–26px font-extrabold, секции H2 — 17px bold.
- **Числа:** `tabular-nums` на инпутах с числами (количество ингредиентов, время, калории).
- **Inputs:** pill (rounded-full, h-11) или rounded-xl для textarea. Bg `bg-bg-2`, border `border-border`, focus — `border-accent`. **Никаких rounded-sm.**
- **Кнопки:** все pill. Primary — accent fill. Secondary — bg-bg-2 border-border.
- **Структура:** разбей на маленькие именованные компоненты с `// ═══ ... ══════` шапками. Один `Screen` с пропом `variant` ('quick' | 'extended' | 'edit-with-picker' | 'edit-with-image-uploaded').

### Контекст

Пользователь хочет добавить рецепт. Сценарии:
- **Быстро** — добавить блюдо в каталог по минимуму: только название + время приёма + ингредиенты (например, чтобы можно было сразу добавить в план или фильтровать). Это «когда у меня нет времени, и я хочу запомнить что это блюдо вообще существует».
- **Расширенно** — полный рецепт с фото, видео, пошаговыми инструкциями, КБЖУ, тегами. «Когда я хочу поделиться, или сохранить как полноценный рецепт».
- **Редактирование** — редактирую существующий рецепт. Режим всегда «расширенный» (нет смысла даунгрейдить).
- **Копирование** — открыл чужой рецепт → копирую к себе как private. Всё то же что новый, но с предзаполненными полями + плашка-уведомление сверху.

### Ограничения

- Мобильный first.
- Одиночный `.jsx`, моки внутри.
- Tailwind core + hex inline для акцентов.
- Иконки — `lucide-react`: ChevronLeft, Check, X, Plus, Camera, Video, Upload, Star, AlertCircle, Eye, Lock, Users, Globe, Search, Sparkles.
- Без API, всё на `useState`.

### Дизайн-система (reference — копия из design-system.md)

**Цвета:**
- Фон: `#F6F4EF` / карточки `#FFFFFF` / мягкий `#F5EFE6` / бордер `#E5D8C8`
- Акцент `#C4704A`, accent-muted `rgba(196,112,74,0.10)`, accent-border `rgba(196,112,74,0.25)`
- Sage `#5C7A59`, sage-muted `rgba(92,122,89,0.08)`, sage-border `rgba(92,122,89,0.30)`
- Text `#1C1917` / text-2 `#78716C` / text-3 `#A8A29E`
- Red для destructive `#D14343`
- Шрифт Nunito, `fontFamily: 'Nunito, system-ui, sans-serif'`

**Радиусы:** pill для кнопок/chip/input, rounded-2xl для карточек, rounded-xl для sub-блоков.

### Состояния экрана

В одном артефакте **четыре состояния** друг под другом с разделителями:

1. **Quick mode (новое блюдо, минимум полей)** — только название, категории (chips), время приёма (chips), ингредиенты, доступ.
2. **Extended mode (новое блюдо, расширенный)** — все поля выше + описание, время готовки, теги, фото, видео, шаги рецепта.
3. **Picker ингредиентов открыт (bottom-sheet)** — модалка поверх формы. Поиск по нему, чипы категорий вверху, список ингредиентов с эмодзи. Внизу — кнопка «Готово» (закрывает) и кнопка «Создать новый» (если ничего не нашлось).
4. **Edit mode с загруженными фото** — показываем как выглядит секция «Фото» когда уже есть 3 загруженных снимка (звёздочка-главное, кнопка ✕ удалить, тап чтобы сделать главным).

### Данные (мок)

```js
const CATEGORIES = [
  { value: 'SOUP',    label: 'Суп'      },
  { value: 'SALAD',   label: 'Салат'    },
  { value: 'MAIN',    label: 'Основное' },
  { value: 'SIDE',    label: 'Гарнир'   },
  { value: 'DESSERT', label: 'Десерт'   },
  { value: 'DRINK',   label: 'Напиток'  },
  { value: 'BAKERY',  label: 'Выпечка'  },
  { value: 'SAUCE',   label: 'Соус'     },
];

const MEAL_TIMES = [
  { value: 'BREAKFAST', label: 'Утро'    },
  { value: 'LUNCH',     label: 'Обед'    },
  { value: 'DINNER',    label: 'Вечер'   },
  { value: 'SNACK',     label: 'Перекус' },
  { value: 'ANYTIME',   label: 'Любое'   },
];

const UNITS = ['г', 'кг', 'мл', 'л', 'шт', 'зубчик', 'пучок', 'щепотка', 'ст.л.', 'ч.л.'];

const VISIBILITY_OPTIONS = [
  { value: 'PRIVATE',    label: 'Личный',         desc: 'Только вы',                        Icon: Lock  },
  { value: 'FAMILY',     label: 'Семья',          desc: 'Только участники семейной группы', Icon: Users },
  { value: 'ALL_GROUPS', label: 'Все мои группы', desc: 'Участники всех ваших групп',       Icon: Globe },
];

const SELECTED_INGREDIENTS = [
  { id: 'i1', name: 'Куриное филе',   emoji: '🍗', amountValue: '500', unit: 'г',    toTaste: false, optional: false },
  { id: 'i2', name: 'Шампиньоны',     emoji: '🍄', amountValue: '300', unit: 'г',    toTaste: false, optional: false },
  { id: 'i3', name: 'Сливки 20%',     emoji: '🥛', amountValue: '200', unit: 'мл',   toTaste: false, optional: false },
  { id: 'i4', name: 'Чеснок',         emoji: '🧄', amountValue: '3',   unit: 'зубчик', toTaste: false, optional: false },
  { id: 'i5', name: 'Соль и перец',   emoji: '🧂', amountValue: '',    unit: 'г',    toTaste: true,  optional: false },
];

const ALL_INGREDIENTS = [
  { id: 'a1', name: 'Помидоры',       emoji: '🍅', category: 'vegetable' },
  { id: 'a2', name: 'Огурцы',         emoji: '🥒', category: 'vegetable' },
  { id: 'a3', name: 'Лук репчатый',   emoji: '🧅', category: 'vegetable' },
  { id: 'a4', name: 'Курица',         emoji: '🍗', category: 'meat' },
  { id: 'a5', name: 'Сыр',            emoji: '🧀', category: 'dairy' },
  { id: 'a6', name: 'Молоко',         emoji: '🥛', category: 'dairy' },
  { id: 'a7', name: 'Хлеб',           emoji: '🍞', category: 'bread' },
  { id: 'a8', name: 'Яйца',           emoji: '🥚', category: 'protein' },
  { id: 'a9', name: 'Картофель',      emoji: '🥔', category: 'vegetable' },
  { id: 'a10', name: 'Морковь',       emoji: '🥕', category: 'vegetable' },
];

const ING_CATEGORIES = [
  { value: 'all',       label: 'Все' },
  { value: 'meat',      label: 'Мясо' },
  { value: 'vegetable', label: 'Овощи' },
  { value: 'dairy',     label: 'Молочное' },
  { value: 'bread',     label: 'Хлеб' },
  { value: 'protein',   label: 'Белки' },
];

const UPLOADED_IMAGES = [
  'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=300',
  'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=300',
  'https://images.unsplash.com/photo-1588013273468-315fd88ea34c?w=300',
];
```

### Структура экрана

#### Sticky header (на всех состояниях кроме picker)

- Высота 52px, `bg-bg-2/95 backdrop-blur`, нижний бордер.
- Слева: круглая icon-кнопка `←` (ChevronLeft).
- По центру: title — «Новый рецепт» / «Редактировать рецепт» 15px font-bold (truncate если длинно).
- Справа: pill-кнопка `Сохранить` (h-9, px-4, accent-fill). Если форма не валидна — disabled-state (opacity 50, нельзя кликать).

#### Под header: уведомления-баннеры (опц.)

- **Group context** (когда `fromGroup`): accent-muted-плашка `«Блюдо будет добавлено в группу „Семья“»` 13px text-accent.
- **Copy notice** (когда `copyFromId`): sage-muted-плашка `«Это копия рецепта „Карбонара“. Адаптируйте под себя.»` 13px text-sage.

#### Mode switcher (только для нового блюда)

Сегмент-control в pill-стиле (как в фильтрах сложности на DishesPage):
```
[ Быстро | Расширенно ]
```
Активный — accent-fill (white text), неактивный — text-text-2.

Между ним и формой — `mt-7`.

#### Поля формы (в порядке)

В **Quick** mode (минимум):
1. Название (required) — pill-input
2. Категории (required в extended) — chip'ы flex-wrap
3. Время приёма пищи (required) — chip'ы flex-wrap
4. Ингредиенты — список карточек + кнопка «+ Добавить ингредиент»
5. Доступ — radio-cards (PRIVATE / FAMILY / ALL_GROUPS)
6. Кнопка «Создать блюдо» (full-width primary)

В **Extended** mode добавляются:
- Описание (textarea, 2 rows) — между Названием и Категориями
- Время готовки в минутах (число) — после Времени приёма
- Теги (через запятую) — после Времени готовки
- Фото блюда (до 10 штук) — отдельная секция с превью + кнопка загрузки
- Видео (опционально) — карточка-плейсхолдер с кнопкой загрузки
- Рецепт (textarea, 8 rows) — после Ингредиентов

**Стиль каждого поля:**

- **Label**: uppercase 10.5px tracking-wide text-3, mb-2, с красной звёздочкой `*` для required.
- **PillInput**: h-11 rounded-full bg-bg-2 border-border focus:border-accent, px-4 text-[14.5px].
- **Textarea**: rounded-xl bg-bg-2 border-border focus:border-accent, px-4 py-3 text-[14.5px], min-h по rows.
- **Chip** (для категорий и mealTime): h-9 px-3.5 rounded-full text-[13px] font-bold, активный — `bg-accent-muted border-accent-border text-accent`, неактивный — `bg-bg-2 border-border text-text-2`.
- **Error** под инпутом: text-red-500 text-[12px] mt-1.5 (с иконкой AlertCircle 12px).

#### Секция «Фото» (Extended only)

- Label: «ФОТО БЛЮДА» + рядом мелкий text-3 «до 10 штук».
- Если есть фото — grid 3 колонки gap-2, каждая ячейка 90×90:
  - **Главное фото**: ring-2 ring-accent + accent-плашка ★ слева сверху (8×8px).
  - **Остальные**: ring-1 ring-border, кнопка-плашка ★ слева сверху (на чёрной полупрозрачной заливке) — клик делает главным.
  - Все: круглая ✕-кнопка справа сверху (на чёрной полупрозрачной заливке).
- Если фото < 10 — ниже secondary-кнопка full-width «+ Загрузить фото» (или «+ Добавить ещё»).
- Loading state — Button с `loading` (спиннер).

#### Секция «Видео» (Extended only)

- Label: «ВИДЕО (НЕОБЯЗАТЕЛЬНО)».
- Если ничего не загружено — secondary-кнопка full-width «+ Загрузить видео».
- Если загружено — карточка `bg-sage-muted border-sage-border rounded-xl px-4 py-3`:
  - sage-иконка ✓ + текст «Видео загружено» (text-sage)
  - кнопка-ghost справа «Удалить» (text-red).

#### Секция «Ингредиенты»

- Label: «ИНГРЕДИЕНТЫ».
- Если ничего нет — placeholder text-3 «Пока не выбрано».
- Если есть — список строк-карточек, каждая:
  - bg-bg-2 border-border rounded-xl px-3 py-2.5 flex items-center gap-2
  - **Эмодзи** (16px) | **Название** (13px font-semibold flex-1 truncate) | **Toggle «по вкусу»** (мини-свич + label «вкус» 10px text-2) | **Если НЕ "по вкусу":** [число (input w-14 tabular-nums) | unit (select w-16) ] | **✕** (text-text-3)
- Под списком — кнопка secondary «+ Добавить ингредиент» (sm size).

**Toggle «по вкусу»:** мини-свич 32×18, accent-fill когда on, серый когда off. Когда on — инпут+select скрываются, ставится метка «по вкусу».

#### Секция «Рецепт» (Extended only)

- Label: «РЕЦЕПТ (ШАГИ ПРИГОТОВЛЕНИЯ)».
- Textarea 8 rows, placeholder «Опишите шаги приготовления…».

#### Секция «Доступ»

- Label: «ДОСТУП».
- Список radio-cards (на ширину):
  ```
  [ ○ Lock-icon  Личный — Только вы ]
  [ ○ Users-icon Семья  — Только участники семейной группы ]
  [ ○ Globe-icon Все группы — Участники всех ваших групп ]
  ```
- Карточка: rounded-2xl bg-bg-2 border-border px-4 py-3 flex items-center gap-3.
- Активная: `border-accent bg-accent-muted` (background ~6% накат).
- Внутри: круглый radio (20px outline border-border, при выборе — accent-fill с белым центром-точкой) + Icon (text-accent если выбрана) + текстовый блок (label 13.5px font-bold + desc 11.5px text-text-2).
- Опция FAMILY скрыта если у юзера нет family-группы (просто нет в списке).

#### Submit (внизу, перед closing div)

- Full-width primary pill «Создать блюдо» / «Сохранить изменения».
- Loading state.

#### Picker ингредиентов (отдельное состояние 3 — bottom-sheet)

Поверх затемнения `rgba(28,25,23,0.45)`:
- Sheet `bg-bg-2 rounded-t-3xl pt-3 pb-6 px-5`, max-h 85dvh.
- Handle-бар сверху (40×4 rounded-full bg-border).
- Header: «Добавить ингредиент» (17px bold) + ✕ кнопка справа.
- **Search input** pill (как везде) с Search-иконкой слева.
- **Chips категорий** скроллящиеся горизонтально: Все / Мясо / Овощи / Молочное / ...
- **Список ингредиентов** в две колонки (или одна — выбери что лучше):
  - Карточка `bg-bg-3 border-border rounded-xl px-3 py-2.5 flex items-center gap-2 cursor-pointer hover:bg-accent-muted`
  - Эмодзи (16px) + название (13px font-semibold) + если уже выбран — sage-✓ справа.
- Если ничего не нашлось по поиску — text-text-3 в центре + secondary-кнопка «+ Создать «{query}»» (создаёт новый ingredient).
- Снизу — sticky-кнопка primary «Готово» (full-width pill) с counter «N выбрано».

### Фишки для этой страницы

- **Mode switcher Быстро/Расширенно** — крупный сегмент-control сверху, чтобы юзер сразу понял о какой "глубине" заполнения речь.
- **Toggle «по вкусу»** — мини-свич прямо в строке ингредиента, чтобы было ясно, что у каждого ингредиента есть это свойство, и оно скрывает инпут количества.
- **Главное фото** — звезда-маркер на превью, тап на не-главное → меняем местами; первое фото = главное.
- **Picker ингредиентов как bottom-sheet** — стандартный для нашей системы паттерн.
- **Visibility radio-cards** с иконками и описанием — не просто чекбоксы, а понятные опции с пояснением «кто увидит».
- **Sticky-header с "Сохранить"** — даёт возможность сохранить в любой момент без скролла вниз. Disabled когда форма невалидна.

### Технические напоминания

- `export default`
- Все 4 состояния друг под другом с разделителями `h-8 bg-gray-200` с подписью.
- Моки инлайном, `useState` для form / mode / picker / images.
- Picker — **не fixed**, а просто блок ниже в разделе (или фейковый device-frame с overlay внутри), чтобы всё влезло в один артефакт.
- Loading-state кнопок — спиннер.

### Не забудь

- Токены цвета — через объект `C` наверху файла
- `px-5` горизонтально на корне страницы, между секциями `mt-7`
- Заголовки секций (Label) — uppercase 10.5px tracking-wide text-3
- `tabular-nums` на числах
- Маленькие именованные компоненты с `// ═══` шапками
- **Inputs — все pill (rounded-full)**, textarea — rounded-xl. Никаких rounded-sm.
- Sticky-header 52px поверх формы, кнопка «Сохранить» в нём
