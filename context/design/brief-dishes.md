# ТЗ для claude.ai/design — DishesPage (Каталог блюд)

Каталог всех блюд пользователя + системных. Поиск, фильтры, infinite scroll, FAB «+».

---

## Промпт для claude.ai/design

Создай React-артефакт (`.jsx`) — страница каталога блюд мобильного PWA MealBot.

### Общие правила артефакта (важно!)

- **Не рисуй header (52px сверху) и tab bar (64px снизу)** — они есть отдельно в Layout'е приложения. Нарисуй только контент страницы. Внизу оставь `pb-24` отступ — там будет tab bar.
- **Токены цвета** собери в единый объект `C = { bg, card, bg3, border, accent, accentMuted, accentBorder, sage, sageMuted, sageBorder, text, text2, text3 }` в начале файла и используй через него, не разбрасывай hex по коду.
- **Отступы:** горизонтально везде `px-5` на корневом wrapper страницы (не `mx-5` на каждой секции). Между секциями — **`mt-7` (28px)**, это важно для воздушности.
- **Заголовки:** без принудительных `<br />` — пусть переносятся естественно. Для красоты используй `textWrap: 'pretty'` (на body) или `'balance'` (на H1/H2).
- **Числа:** всем метрикам, времени, калориям — `tabular-nums`.
- **Avatar залогиненного юзера** (если встретится): `bg-bg-3 border border-border text-accent font-bold` — не accent-fill.
- **MetaStrip** (если используется): каждая метрика = **иконка 16-17px text-accent + value + label** (иконка обязательна).
- **Structure:** разбей на маленькие именованные компоненты с комментарием-заголовком `// ═══ Component Name ══════════`. Один компонент `Screen` принимает проп `variant` ('initial' | 'search' | 'filters' | 'empty').

### Контекст

Пользователь открывает список всех доступных блюд — своих, семейных, системных. Хочет найти подходящее по названию / времени приёма пищи / тому что есть в холодильнике. Сценарий: «открыл → ввёл поиск или выбрал фильтр → листает → открывает детальную или добавляет в план».

Ключевые фичи: поиск, фильтр-чипы (время еды), quick filters (холодильник / избранное), фильтр-модалка (теги, сложность, кухня — открывается по кнопке), FAB для добавления, "bulk add" (пачкой через запятую).

### Ограничения

- Мобильный first.
- Одиночный `.jsx`, моки внутри.
- Tailwind core + inline hex для акцентов.
- Иконки — `lucide-react`: Search, Heart, Refrigerator, SlidersHorizontal, ArrowUpDown, Plus, Clock, Flame, X, Check.
- Без API, всё на `useState`.

### Дизайн-система (reference — копия из design-system.md)

**Цвета:**
- Фон: `#F6F4EF` / карточки `#FFFFFF` / мягкий `#F5EFE6` / бордер `#E5D8C8`
- Акцент `#C4704A`, accent-muted `rgba(196,112,74,0.1)`
- Sage `#5C7A59`, sage-muted `rgba(92,122,89,0.08)`
- Text `#1C1917` / text-2 `#78716C` / text-3 `#A8A29E`
- Шрифт Nunito, `fontFamily: 'Nunito, system-ui, sans-serif'`

**Радиусы:** pill (full) для кнопок/chip, rounded-2xl для карточек, rounded-xl для sub-блоков.

**Типографика:** H1=26px extrabold, H2=17px bold, body 14–15px, meta 12px text-3.

**Кнопки все pill.** Chip: primary-active = `bg-accent-muted border-accent/25 text-accent`, neutral = `bg-white border-border text-text-2`.

**Отступы:** `px-5` горизонтально, `mt-7/8` между секциями.

### Состояния экрана

В одном артефакте **четыре состояния** друг под другом с разделителями:

1. **Начальный (залогинен, есть блюда)** — полный рабочий вид
2. **Поиск активен** — поле введено, часть результатов
3. **Фильтр-панель открыта** — показывает модалку-sheet с фильтрами по тегам/сложности/кухне
4. **Пустое состояние (ничего не найдено)** — всё отфильтровано

### Данные (мок)

```js
const DISHES = [
  { id: '1', name: 'Борщ украинский с говядиной', img: 'https://images.unsplash.com/photo-1518291344630-4857135fb581?w=300', time: 90, cal: 280, tags: ['сытно', 'суп'], mealTime: ['LUNCH', 'DINNER'], inFridge: false, missing: 3, fav: true },
  { id: '2', name: 'Салат Цезарь с курицей', img: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=300', time: 20, cal: 340, tags: ['быстро', 'салат'], mealTime: ['LUNCH'], inFridge: true, missing: 0, fav: false },
  { id: '3', name: 'Паста карбонара', img: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=300', time: 25, cal: 620, tags: ['быстро'], mealTime: ['LUNCH', 'DINNER'], inFridge: false, missing: 2, fav: true },
  { id: '4', name: 'Плов с бараниной', img: 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=300', time: 75, cal: 520, tags: ['сытно'], mealTime: ['DINNER'], inFridge: false, missing: 4, fav: false },
  { id: '5', name: 'Гречка с грибами и луком', img: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=300', time: 30, cal: 310, tags: ['постно', 'просто'], mealTime: ['LUNCH', 'DINNER'], inFridge: true, missing: 0, fav: false },
  { id: '6', name: 'Куриный бульон с лапшой', img: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=300', time: 45, cal: 180, tags: ['суп', 'лёгкое'], mealTime: ['LUNCH'], inFridge: true, missing: 1, fav: false },
];

const TAGS = ['быстро', 'сытно', 'лёгкое', 'постно', 'суп', 'салат', 'просто', 'мясо', 'без глютена'];
const CUISINES = ['Русская', 'Итальянская', 'Азиатская', 'Грузинская', 'Французская'];
const DIFFICULTIES = [{ id: 'easy', label: 'Легко' }, { id: 'medium', label: 'Средне' }, { id: 'hard', label: 'Сложно' }];
```

### Структура экрана

1. **PageHeader:** H1 «Мои блюда» слева (26px extrabold), справа мелкий счётчик «128 блюд» text-3.

2. **Search input (pill-стиль):** pill-контейнер `bg-white border border-border rounded-full`, слева иконка Search 18px text-3, справа крестик очистки (если введено). Placeholder «Искать блюда, ингредиенты...».

3. **MealType chips (скроллимый ряд):** 5 chip'ов (Все / Завтрак / Обед / Ужин / Перекус), один активный — accent-muted стиль. Горизонтальный скролл если не помещаются. `px-5 gap-2 overflow-x-auto`.

4. **Quick filters row:** 4 элемента в ряд:
   - `[Chip success-стиль] 🧊 Холодильник` — активный sage-muted, неактивный white+border
   - `[Chip neutral] ❤ Избранное` — активный accent-muted
   - `flex-1` (пустой пространство)
   - Круглая кнопка сортировки (36px white + border, иконка ArrowUpDown)
   - Круглая кнопка фильтров (36px, если активны фильтры — accent-fill, иначе white)

5. **Hint-баннер (состояние 1, опционально):** однократная подсказка «Добавить несколько блюд — можно через запятую →» — белая карточка с крестиком. В других состояниях скрыта.

6. **Список блюд (row-variant):** карточки `h-[84-92px] bg-white rounded-2xl border border-border p-3 flex gap-3 items-center`:
   - Фото `w-[72px] h-[72px] rounded-xl` слева. Если `inFridge:true` — крошечная sage-галочка на фото в углу. Если `missing > 0` — accent-badge «−2» поверх фото.
   - Центр: название `text-[15px] font-semibold` (обрезание в 2 строки), мета-строка `text-[12px] text-text-3` — время с иконкой Clock, калории с Flame, теги как очень мелкие pills
   - Справа: колонка действий — Heart (`text-accent fill` если fav, иначе `text-text-3`), ниже иконка Plus в кружке для «добавить в план»

7. **Sentinel-индикатор подгрузки:** спиннер accent `w-6 h-6` с `border-t-transparent animate-spin` снизу списка.

8. **FAB (внизу справа):** pill с текстом «Добавить блюдо» + иконка Plus, bottom-20 right-4 (над tab bar), bg-accent.

9. **Empty state (состояние 4):** по центру — круг bg-bg-3 (56px) с иконкой Search или эмодзи 🔍 внутри, ниже H3 «Ничего не найдено» text-15 bold, ниже text-13 text-2 «Попробуй изменить поиск или сбросить фильтры», ниже кнопка-ghost «Сбросить фильтры» accent-текст.

10. **Фильтр-модалка (состояние 3):** bottom-sheet поверх экрана. Прозрачный overlay + белый sheet снизу (`rounded-t-3xl`, `pt-5 pb-8 px-5`). Внутри:
    - handle-бар сверху (серая полоска)
    - Заголовок «Фильтры» + кнопка «Сбросить» справа
    - Секция «Теги» — chip'ы neutral стиля, выбранные — primary
    - Секция «Кухня» — chip'ы neutral, выбранные — primary
    - Секция «Сложность» — 3 кнопки segmented-control (accent-fill для активной)
    - Внизу primary-кнопка «Показать 42 блюда» во всю ширину

### Фишки для этой страницы

- **Badge "-2"** на фото блюда когда не хватает ингредиентов. Accent-фон, круг. Визуально сразу видно «что можно приготовить сейчас».
- **Pill-search** вместо квадратного input — вписывается в общую систему.
- **Фильтр-модалка как bottom-sheet** — один из ключевых паттернов системы.
- **Hint-баннер про bulk-add** — однократный, закрывается крестиком.
- **Segmented control для сложности** — отдельный паттерн для взаимоисключающих вариантов.

### Технические напоминания

- `export default`
- 4 состояния друг под другом, разделители `h-8 bg-gray-200` с подписью по центру
- Моки инлайном, `useState` для filters/search
- Модалка для состояния 3 — **не с fixed positioning**, а просто ниже в разделе, чтобы всё влезло в один артефакт (можно обернуть в фейковый device frame с overlay внутри)

### Не забудь

- Токены цвета — через объект `C` наверху файла
- `px-5` горизонтально на корне страницы, между секциями `mt-7`
- Заголовки без принудительных `<br />`
- `textWrap: 'pretty'` / `'balance'` на заголовках
- `tabular-nums` на числах
- Маленькие именованные компоненты с `// ═══` шапками
- Нижний отступ `pb-24` (под tab bar)
