# ТЗ для claude.ai/design — MealPlanPage (План питания)

Страница плана готовки. Группировка блюд по дате → по типу приёма пищи. Семейный план (с аватарами участников).

---

## Промпт для claude.ai/design

Создай React-артефакт (`.jsx`) — страница плана питания мобильного PWA MealBot.

### Общие правила артефакта (важно!)

- **Не рисуй header (52px сверху) и tab bar (64px снизу)** — они есть в Layout'е приложения. Только контент. Внизу оставь `pb-24` отступ.
- **Токены цвета** собери в объект `C = { bg, card, bg3, border, accent, accentMuted, accentBorder, sage, sageMuted, sageBorder, text, text2, text3 }` в начале файла.
- **Отступы:** горизонтально `px-5` на корне (не `mx-5` на каждой секции). Между секциями — `mt-7` (28px).
- **Заголовки:** без принудительных `<br />`. `textWrap: 'pretty'` / `'balance'`.
- **Числа:** `tabular-nums` для счётчиков («6 блюд · 3 дня»), времени, калорий.
- **Avatar автора блюда** (ключевая фишка): `bg-bg-3 border border-border text-accent font-bold` 24px. Не accent-fill.
- **Structure:** именованные компоненты с `// ═══ ... ══════` шапками. Один `Screen` с пропом `variant` ('guest' | 'empty' | 'normal').

### Контекст

Пользователь планирует что готовить вперёд. Добавляет блюда в план из карточки блюда или из каталога. План может быть семейным — тогда блюда видят все члены FAMILY-группы, и видно кто добавил. Сценарий: «открыл → увидел сегодня / завтра / неделю → либо убрал, либо отметил "готовится сейчас"».

Ключевое:
- Сортировка по дате (ближайшие первыми)
- Внутри дня — группировка по mealType (Завтрак / Обед / Ужин / Перекус / без метки)
- На сегодня — отдельная pinned-плашка с акцентом
- В семейном плане у каждого блюда — аватар автора
- Можно убрать блюдо свайпом или кнопкой-крестиком
- Быстрый фильтр: Все / Мои / Семейные (если в FAMILY-группе)

### Ограничения

Мобильный first, `.jsx`, Tailwind core + hex inline, `lucide-react`, `useState`.

Иконки: Calendar, CalendarPlus, Sun, Utensils, Moon, Cookie, X, Users, Check, ChevronRight, Sparkles, Flame, Clock.

### Дизайн-система (reference)

Цвета, токены как обычно. Акцент `#C4704A`, accent-muted `rgba(196,112,74,0.1)`, accent-border `rgba(196,112,74,0.2)`. Sage, text, всё как в design-system. Nunito.

Радиусы, типографика, кнопки — по стандарту.

### Состояния экрана

В одном артефакте **три состояния**:

1. **Гость** — EmptyState + CTA
2. **Пустой план** (залогинен) — empty state с CTA «Посмотреть блюда»
3. **Рабочий вид** (FAMILY-группа, 3 дня, несколько блюд на сегодня)

### Данные (мок)

```js
const userId = 'u-me';

const PLANS = [
  // сегодня
  { id: 'p1', date: '2026-04-20', mealType: 'BREAKFAST', dish: { id: 'd1', name: 'Овсянка с ягодами', img: 'https://images.unsplash.com/photo-1517673400267-0251440c45dc?w=300', time: 5, cal: 320 }, addedBy: { id: 'u-me',  name: 'Марина', initial: 'М' } },
  { id: 'p2', date: '2026-04-20', mealType: 'LUNCH',     dish: { id: 'd2', name: 'Борщ с говядиной', img: 'https://images.unsplash.com/photo-1518291344630-4857135fb581?w=300', time: 90, cal: 280 }, addedBy: { id: 'u-husband', name: 'Дима', initial: 'Д' } },
  { id: 'p3', date: '2026-04-20', mealType: 'DINNER',    dish: { id: 'd3', name: 'Курица с грибами', img: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=300', time: 30, cal: 480 }, addedBy: { id: 'u-me', name: 'Марина', initial: 'М' } },
  // завтра
  { id: 'p4', date: '2026-04-21', mealType: 'BREAKFAST', dish: { id: 'd4', name: 'Сырники со сметаной', img: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=300', time: 15, cal: 420 }, addedBy: { id: 'u-me', name: 'Марина', initial: 'М' } },
  { id: 'p5', date: '2026-04-21', mealType: 'DINNER',    dish: { id: 'd5', name: 'Паста карбонара', img: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=300', time: 25, cal: 620 }, addedBy: { id: 'u-husband', name: 'Дима', initial: 'Д' } },
  // четверг
  { id: 'p6', date: '2026-04-23', mealType: 'ANYTIME',   dish: { id: 'd6', name: 'Запеканка творожная', img: 'https://images.unsplash.com/photo-1464195244916-405fa0a82545?w=300', time: 40, cal: 380 }, addedBy: { id: 'u-me', name: 'Марина', initial: 'М' } },
];

const MEAL_META = {
  BREAKFAST: { label: 'Завтрак',  icon: Sun },
  LUNCH:     { label: 'Обед',     icon: Utensils },
  DINNER:    { label: 'Ужин',     icon: Moon },
  SNACK:     { label: 'Перекус',  icon: Cookie },
  ANYTIME:   { label: null,       icon: null },
};
```

### Структура экрана

#### Состояние 1 — Гость

Empty-state:
- Круг bg-bg-3 (64px) с Calendar icon
- H2 «Планируй меню заранее» 17px bold
- text-14 text-2 «Добавляй блюда на неделю вперёд — и больше не думай, что готовить каждый день»
- Primary-кнопка «Создать свою кухню»
- Ghost «Уже есть аккаунт? Войти»

#### Состояние 2 — Пустой план

Empty-state:
- Круг bg-bg-3 (64px) с CalendarPlus icon
- H2 «План пока пустой» 17px bold
- text-14 text-2 «Добавляй блюда в план прямо из карточки рецепта — кнопка "В план готовки"»
- Primary-кнопка «Посмотреть блюда» (ведёт на /dishes)

#### Состояние 3 — Рабочий вид

1. **PageHeader:** H1 «План готовки» 26px extrabold. Справа — мелкий счётчик «6 блюд · 3 дня».

2. **Фильтр-чипы (если FAMILY):** «Все · 6», «Мои · 4», «Семейные · 6» — pill chip'ы. Активный = accent-muted стиль. Горизонтальный скролл.

3. **Мета-полоска (опционально):** 3 метрики — «Готовим сегодня: 3», «На этой неделе: 5», «Всего: 6». Последнее подсветить sage если планирование «в порядке».

4. **Pinned-блок «Сегодня»:** особенный контейнер с accent-muted фоном и accent-border `rgba(196,112,74,0.2)`:
   - Заголовок с иконкой: `📅 Сегодня · 20 апреля, понедельник` в accent-цвете, 15px bold
   - Подзаголовок: «3 приёма пищи запланировано» 12px accent-muted
   - Внутри — список plan-items (описание ниже) в group-box. Между элементами — мягкий divider `border-accent/10`.

5. **Обычный блок дня:** для каждого дня (завтра, четверг):
   - Date header: `text-2 uppercase tracking-wide 11px font-bold pb-2 border-b border-border mb-3` — «ВТОРНИК, 21 АПРЕЛЯ»
   - Группы по mealType:
     - Sub-label (если есть): `flex items-center gap-2 mb-2` — иконка Sun 14px text-accent + text-13 font-bold «Завтрак»
     - Plan-item карточки (описание ниже)

6. **Plan-item карточка:** `bg-white rounded-2xl border border-border p-3 flex gap-3 items-center`:
   - Фото `w-[60px] h-[60px] rounded-xl`
   - Центр: название 14.5px font-semibold (truncate 2 строки), мета-строка 11px text-3 (Clock+время, Flame+cal)
   - Аватар-инициал 24px (если автор не = me, показать. Если me — не показываем или показываем маленько справа в углу) `bg-bg-3 border border-border text-accent font-bold`
   - X-кнопка удаления 28px text-3

7. **FAB:** pill accent «+ В план» → navigate to /dishes

### Фишки для этой страницы

- **Pinned-плашка "Сегодня"** — ключевой визуальный акцент страницы. Accent-muted контейнер обрамляет сегодняшние приёмы пищи — чтобы глаз сразу прыгал на «что готовим сейчас».
- **Аватар автора блюда** для FAMILY-плана — показывает «это Дима добавил» не занимая места. 24px инициал с accent-текстом.
- **Group-box внутри pinned** — все сегодняшние блюда в одной коробке с разделителями. Не три отдельные карточки.
- **Sub-label приёма пищи с иконкой lucide** — заменяет простое текст-bold, визуально более «живая» группировка.
- **Мета-полоска с sage-метрикой** — подчёркивает success-состояние.

### Варианты, которые можно попробовать

Если есть место — **два варианта "сегодня"**:
- **A** — group-box pinned (как описано)
- **B** — раздельные карточки но с accent-left-border каждая, без общей обёртки

### Технические напоминания

- `export default`
- 3 состояния друг под другом
- Моки инлайном
- Даты format: «понедельник, 20 апреля» (русский, `toLocaleDateString('ru-RU')`)
- Один из авторов в моках — не я (чтобы видеть аватар)

### Не забудь

- Токены цвета — через объект `C` наверху файла
- `px-5` горизонтально на корне страницы, между секциями `mt-7`
- Заголовки без принудительных `<br />`
- `textWrap: 'pretty'` / `'balance'` на заголовках
- `tabular-nums` на числах
- Маленькие именованные компоненты с `// ═══` шапками
- Нижний отступ `pb-24` (под tab bar)
- Avatar автора блюда: `bg-bg-3 border-border text-accent font-bold` (не accent-fill)
