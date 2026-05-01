# ТЗ для claude.ai/design — Layout (Header + Tab Bar)

Общий каркас приложения. Верхний header (52px) + нижний tab bar (64px). Одинаковый на всех страницах. Меняется только активный таб и опциональные элементы в header'е.

---

## Промпт для claude.ai/design

Создай React-артефакт (`.jsx`) — общий Layout мобильного PWA MealBot. Два компонента: верхний header (52px) и нижний tab bar (64px).

### Общие правила артефакта (важно!)

- **Токены цвета** собери в единый объект `C = { bg, card, bg3, border, accent, accentMuted, sage, text, text2, text3, pro: '#B8935A', red: '#D14343' }` в начале файла.
- **Отступы:** горизонтально `px-4` (в header/tab bar) — это исключение из общего правила `px-5` (header плотнее).
- **Avatar юзера в header:** `bg-bg-3 border border-border text-accent font-bold`. Не accent-fill. Pro — добавить `ring-2` с pro-цветом `#B8935A`.
- **Числа** на бейджах (колокольчик, tab-бейджи): `tabular-nums`.
- **Structure:** отдельные компоненты `<Header variant=.../>` и `<TabBar active=... bellCount=... planBadge=... />` с комментариями-шапками `// ═══ ... ═════`.

### Контекст

Приложение — мобильный PWA с нативным ощущением. Layout один на всё приложение:
- **Header сверху** (52px) — лого + название + колокольчик + аватар. Меняется только аватар (или login-ссылка для гостя) и badge на колокольчике.
- **Tab bar снизу** (64px) — 5 табов. Активный выделен accent-цветом. На табе «План» может быть мини-бейдж «3» (сколько блюд на сегодня). Safe-area внизу для iOS.

Между header и tab bar — контент страницы (скроллится). Header и tab bar **не скроллятся**, залипают.

Ключевое:
- **Header:** логотип MealBot (эмодзи или мини-SVG) + название «Моя кухня» слева, колокольчик + аватар справа
- **Tab bar:** 5 иконок-табов с подписью. Активный — accent. Бейджики для уведомлений.
- Табы: **Главная** (Home), **Блюда** (ChefHat), **План** (Calendar), **Чат** (Sparkles), **Профиль** (User)
- Safe-area iOS — нижний отступ 8px внутри tab bar, чтобы не упираться в home-indicator

### Ограничения

Мобильный first, одиночный `.jsx`, Tailwind core + hex inline, `lucide-react`, `useState`.

Иконки: Home, ChefHat, Calendar, Sparkles, User, Bell, Menu, ChevronLeft.

### Дизайн-система (reference)

Цвета: `#F6F4EF` / `#FFFFFF` / `#F5EFE6` / `#E5D8C8`. Акцент `#C4704A`, accent-muted `rgba(196,112,74,0.1)`. Sage `#5C7A59`. Text `#1C1917`/`#78716C`/`#A8A29E`. Red для badge `#D14343`. Nunito.

Радиусы: pill для chip, rounded-full для аватара и круглых кнопок.

Типографика: label таба 10-11px font-semibold, body 14-15px, H2 17px bold.

Тени: tab bar `0 -1px 12px rgba(0,0,0,0.04)` сверху, header `0 1px 6px rgba(0,0,0,0.04)` снизу.

### Состояния экрана

В одном артефакте **шесть состояний** друг под другом с подписями:

1. **Header — гость** (не залогинен)
2. **Header — залогинен, free-юзер, 0 уведомлений**
3. **Header — Pro, 2 уведомления**
4. **Header — с back-button** (на вложенной странице, например /dishes/:id)
5. **Tab bar — default** (активен «Главная», нет бейджиков)
6. **Tab bar — с бейджем** (активен «План», на «Плане» бейдж «3», на «Чате» бейдж «·»-точка)

Плюс **бонус-состояние 7** — комбинация Layout в сборе: header + фейковый контент + tab bar, в одном device-фрейме, чтобы видеть пропорции.

### Данные (мок)

```js
const TABS = [
  { id: 'home',    label: 'Главная', icon: Home,      path: '/' },
  { id: 'dishes',  label: 'Блюда',   icon: ChefHat,   path: '/dishes' },
  { id: 'plan',    label: 'План',    icon: Calendar,  path: '/plan' },
  { id: 'chat',    label: 'Чат',     icon: Sparkles,  path: '/chat' },
  { id: 'profile', label: 'Профиль', icon: User,      path: '/profile' },
];

const USER = {
  name: 'Марина',
  initial: 'М',
  isPro: false,
  notifications: 2,
};
```

### Структура

#### Header (52px)

Общий контейнер:
- `h-[52px] bg-white border-b border-border px-4 flex items-center justify-between sticky top-0 z-40`
- Тонкая тень снизу `boxShadow: '0 1px 6px rgba(0,0,0,0.04)'`

**Левая часть (логотип + название):**
- Контейнер `flex items-center gap-2`
- Лого-круг 32px `rounded-full bg-accent-muted flex items-center justify-center`:
  - Внутри эмодзи 🍳 или ChefHat icon 16px text-accent (выбери что лучше)
- Название «MealBot» 16px font-extrabold text-text. Ниже мелким text-11 text-3 «Моя кухня» (опционально — только если есть место).

**Правая часть:**
- Контейнер `flex items-center gap-2`
- **Колокольчик** 40px кнопка круглая `rounded-full hover:bg-bg-3 flex items-center justify-center relative`:
  - Bell icon 20px text-text-2
  - Если `notifications > 0` — красный dot 8px `absolute top-2 right-2 bg-[#D14343] rounded-full border-2 border-white`
  - Если `notifications > 9` — вместо точки badge `min-w-[16px] h-[16px] bg-[#D14343] text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1` с числом «9+»
- **Avatar 32px круглый:**
  - Залогинен: `bg-accent-muted text-accent font-bold text-[13px] rounded-full flex items-center justify-center`, внутри initial «М»
  - Pro: дополнительно `ring-2 ring-pro` вокруг (золотая рамка `#B8935A`) — видимый индикатор статуса
  - Гость: не аватар, а маленькая pill-ссылка «Войти» accent `bg-accent text-white px-3 h-8 rounded-full text-[13px] font-bold`

**Специальный режим header'а — back-button (для вложенных страниц):**
- Вместо логотипа слева — круглая кнопка 40px `rounded-full hover:bg-bg-3` с ChevronLeft 20px text-text-2
- В центре (абсолютное позиционирование) — название текущей страницы 15px font-bold (например «Борщ украинский», truncate)
- Справа — всё то же (колокольчик + аватар) или только одна из иконок в зависимости от контекста (например, на DishDetailPage справа — Share и Heart)

#### Tab bar (64px + safe-area)

Общий контейнер:
- `fixed bottom-0 left-0 right-0 bg-white border-t border-border pt-1.5 pb-2 px-2 flex items-end justify-around z-40`
- Высота 64px (без safe-area) / 80px (с safe-area iOS — добавить `pb-safe` или inline `paddingBottom: 'max(8px, env(safe-area-inset-bottom))'`)
- Тонкая тень сверху `boxShadow: '0 -1px 12px rgba(0,0,0,0.04)'`

**Кнопка таба** (5 штук в ряд, `flex-1`):
- `flex flex-col items-center justify-center gap-0.5 py-1 relative min-h-[52px]`
- Иконка lucide 22px:
  - Активный: `text-accent`
  - Неактивный: `text-text-3`
- Label под иконкой:
  - Активный: `text-[10.5px] font-bold text-accent`
  - Неактивный: `text-[10.5px] font-semibold text-text-3`
- Активный таб дополнительно:
  - Опция A — тонкая accent-линия сверху иконки `w-8 h-0.5 rounded-full bg-accent absolute top-0`
  - Опция B — accent-muted подложка под иконкой (круг 36px rounded-full bg-accent-muted)
  - Попробуй обе в артефакте, подпиши какая где
- **Бейдж на табе:**
  - Мини-бейдж числом: `absolute top-0 right-[25%] min-w-[16px] h-[16px] bg-accent text-white text-[9px] font-extrabold rounded-full flex items-center justify-center px-1`
  - Dot-бейдж (для «есть что-то новое, но без числа»): `absolute top-1 right-[28%] w-2 h-2 bg-accent rounded-full`

#### Состояние 1 — Header гость

Слева: лого MealBot + «Моя кухня»
Справа: колокольчик (disabled / без бейджа) + pill «Войти» accent

#### Состояние 2 — Header залогинен, free, 0 notifications

Слева: лого + «Моя кухня»
Справа: колокольчик без бейджа + avatar initial «М» accent-muted

#### Состояние 3 — Header Pro, 2 notifications

Слева: лого
Справа: колокольчик с red dot (2 уведомления → показываем dot или число «2») + avatar с pro-ring золотой

#### Состояние 4 — Header с back-button

Слева: ChevronLeft круглая кнопка
Центр: название «Борщ украинский» 15px font-bold (truncate)
Справа: вариант A — Heart + Share (для DishDetailPage), вариант B — только колокольчик (для остальных вложенных)

Нарисуй оба варианта под подписями.

#### Состояние 5 — Tab bar default (активен «Главная»)

5 табов, активный «Главная». Покажи две опции активного состояния (A — accent-line сверху, B — accent-muted подложка).

#### Состояние 6 — Tab bar с бейджами

- «Главная» неактивна
- «Блюда» неактивна
- «План» активен + бейдж «3» accent mini-number
- «Чат» неактивен + dot-бейдж (новое сообщение)
- «Профиль» неактивна

#### Состояние 7 — Layout в сборе (бонус)

Device-фрейм 375×812px (или 430×932):
- Header (52px) сверху — залогинен, free, 0 notifications
- Контент (скроллимая область) — просто placeholder `bg-bg-3 flex items-center justify-center text-3` «Page content»
- Tab bar снизу — с бейджем «3» на Плане, активный «Главная»

Это даёт понимание как вся связка выглядит в реальном приложении.

### Фишки

- **Pro-ring вокруг аватара** — золотая обводка для Pro-юзеров. Видимый статус без отдельного badge'а в header.
- **Red dot на колокольчике** вместо числа для 1-9 уведомлений, число только для >9 — так проще и чище.
- **Две опции активного таба** (линия vs подложка) — показать в артефакте, выберем потом.
- **Back-button режим header'а** — для вложенных страниц. Иначе пользователь застревает.
- **Safe-area для iOS** — `env(safe-area-inset-bottom)` — чтобы tab bar не упирался в home-indicator.

### Технические напоминания

- `export default`
- 7 состояний друг под другом, разделители `h-8 bg-gray-200` с подписью
- Моки инлайном
- useState для: активного таба (в состояниях 5, 6, 7)
- В состоянии 7 обернуть всё в device-frame `max-w-[375px] mx-auto h-[812px] border rounded-[40px] overflow-hidden relative bg-bg` — чтобы видеть как в реальном телефоне

### Не забудь

- Токены цвета — через объект `C` наверху файла
- Avatar юзера: `bg-bg-3 border-border text-accent font-bold` (не accent-fill)
- Pro — `ring-2` с pro-цветом вокруг аватара
- `tabular-nums` на бейджах
- Два варианта активного таба (A — accent-линия сверху, B — accent-muted подложка под иконкой) обязательно покажи оба
- Safe-area iOS: `paddingBottom: 'max(8px, env(safe-area-inset-bottom))'` на tab bar
