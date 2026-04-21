# ТЗ для claude.ai/design — GroupsPage + GroupDetailPage (Семья и группы)

Две связанные страницы: список групп пользователя и детальная страница одной группы. Делаем в одном артефакте — чтобы не потерять связность визуального языка между ними.

---

## Промпт для claude.ai/design

Создай React-артефакт (`.jsx`) — страницы семейных групп мобильного PWA MealBot.

### Общие правила артефакта (важно!)

- **Не рисуй основной app-header (52px сверху) и tab bar (64px снизу)** — они в Layout'е. На GroupDetailPage top-bar с ChevronLeft и MoreVertical оставляем (он в брифе ниже). Внизу `pb-24`.
- **Токены цвета** собери в объект `C = { bg, card, bg3, border, accent, accentMuted, accentBorder, sage, sageMuted, sageBorder, text, text2, text3, red }` в начале файла.
- **Отступы:** `px-5` горизонтально на корне. Между секциями `mt-7`.
- **Заголовки:** без принудительных `<br />`. `textWrap: 'pretty'` / `'balance'`.
- **Числа:** `tabular-nums` (счётчик участников, метрики «42 блюда · 18 в холодильнике»).
- **Avatar участников:** `bg-bg-3 border border-border text-accent font-bold`. Не accent-fill.
- **Structure:** именованные компоненты с `// ═══ ... ══════` шапками. Разные `Screen` компоненты для GroupsPage и GroupDetailPage, либо один с пропом `page: 'list' | 'detail'` и `variant`.

### Контекст

Пользователь может состоять в нескольких группах — FAMILY (общий холодильник и план) или FRIENDS (только общий каталог блюд). В семье до 6 человек, в FRIENDS — до 20. Сценарий:
- Открыл список групп → увидел свои группы + пригласительные → зашёл в конкретную
- В детальной: увидел участников, общие блюда/холодильник (для FAMILY), invite-ссылку, может выйти или удалить (если owner)

Ключевое:
- 2 типа групп: **FAMILY** (accent-цвет, общие холодильник+план) и **FRIENDS** (sage-цвет, только общие блюда)
- Роли: **Owner** (создатель), **Member** (обычный), **Pending** (приглашён, не принял)
- Invite через ссылку — кнопка «Скопировать» или QR
- Owner может удалить участника, передать владение, удалить группу
- Member может выйти

### Ограничения

Мобильный first, одиночный `.jsx`, Tailwind core + hex inline, `lucide-react`, `useState`.

Иконки: Users, UserPlus, Crown, Copy, LogOut, Trash2, MoreVertical, Check, X, ChevronRight, Mail, QrCode, Home, Heart, Plus.

### Дизайн-система (reference)

Цвета: `#F6F4EF` / `#FFFFFF` / `#F5EFE6` / `#E5D8C8`. Акцент `#C4704A`, accent-muted `rgba(196,112,74,0.1)`, accent-border `rgba(196,112,74,0.25)`. Sage `#5C7A59`, sage-muted `rgba(92,122,89,0.08)`, sage-border `rgba(92,122,89,0.3)`. Text `#1C1917`/`#78716C`/`#A8A29E`. Nunito.

Радиусы: pill для кнопок/chip, rounded-2xl для карточек, rounded-xl для sub, rounded-full для аватаров.

Типографика: H1=26px extrabold, H2=17px bold, label uppercase 10-11px tracking-wide text-2.

### Состояния экрана

В одном артефакте **пять состояний** друг под другом:

1. **GroupsPage — гость** (не залогинен)
2. **GroupsPage — пустой** (залогинен, 0 групп)
3. **GroupsPage — рабочий вид** (1 FAMILY + 1 FRIENDS + 1 pending invite)
4. **GroupDetailPage — FAMILY-группа** (участник, не owner)
5. **GroupDetailPage — FAMILY-группа, owner-view** (с menu и настройками)

### Данные (мок)

```js
const userId = 'u-me';

const GROUPS = [
  {
    id: 'g1',
    name: 'Семья Фелициас',
    type: 'FAMILY',
    ownerId: 'u-me',
    members: [
      { id: 'u-me',       name: 'Марина', initial: 'М', role: 'OWNER',  joined: '2025-12-01' },
      { id: 'u-husband',  name: 'Дима',   initial: 'Д', role: 'MEMBER', joined: '2025-12-02' },
      { id: 'u-mom',      name: 'Ольга',  initial: 'О', role: 'MEMBER', joined: '2026-01-15' },
    ],
    pending: [
      { email: 'sister@example.com', invitedAt: '2026-04-18' },
    ],
    stats: { dishes: 42, fridge: 18, plans: 6 },
    inviteCode: 'FML-4K2X-9PQR',
  },
  {
    id: 'g2',
    name: 'Друзья-готовальщики',
    type: 'FRIENDS',
    ownerId: 'u-friend',
    members: [
      { id: 'u-friend',   name: 'Катя',  initial: 'К', role: 'OWNER',  joined: '2026-02-10' },
      { id: 'u-me',       name: 'Марина', initial: 'М', role: 'MEMBER', joined: '2026-02-12' },
      { id: 'u-nik',      name: 'Ник',    initial: 'Н', role: 'MEMBER', joined: '2026-02-12' },
      { id: 'u-lena',     name: 'Лена',   initial: 'Л', role: 'MEMBER', joined: '2026-03-01' },
    ],
    pending: [],
    stats: { dishes: 28 },
    inviteCode: 'FRN-7H3M-2BNK',
  },
];

const INCOMING_INVITES = [
  { id: 'inv1', groupName: 'Семья Петровых', type: 'FAMILY', invitedBy: 'Анна', invitedAt: '2026-04-19' },
];
```

### Структура — GroupsPage

#### Состояние 1 — Гость

Empty-state:
- Круг bg-bg-3 (64px) с Users icon
- H2 «Готовьте вместе» 17px bold
- text-14 text-2 «Создайте семейную группу — общий холодильник, план и любимые блюда»
- Primary-кнопка «Создать свою кухню»
- Ghost «Уже есть аккаунт? Войти»

#### Состояние 2 — Пустой

1. **PageHeader:** H1 «Мои группы» 26px extrabold.
2. **Empty block:** круг bg-accent-muted (72px) с Users icon text-accent, H2 «У тебя пока нет групп» 17px bold, text-13 text-2 leading-relaxed «Создай FAMILY-группу чтобы делить холодильник с семьёй, или FRIENDS — чтобы обмениваться рецептами с друзьями», две кнопки в ряд:
   - Primary «+ FAMILY» (accent)
   - Secondary «+ FRIENDS» (sage-bg `bg-sage text-white`)

#### Состояние 3 — Рабочий вид (1 FAMILY + 1 FRIENDS + 1 incoming invite)

1. **PageHeader:** H1 «Мои группы» + справа мелкий счётчик «2 группы» text-3.

2. **Pending invites секция (если есть):**
   - Label uppercase 10-11px font-bold text-2 tracking-wide «ПРИГЛАШЕНИЯ · 1»
   - Карточка invite: `bg-white rounded-2xl border border-accent/25 p-4 flex gap-3 items-center`
     - Круг 40px accent-muted с Mail icon text-accent
     - Центр: «Семья Петровых» 15px font-semibold, text-12 text-3 «от Анны · 1 день назад»
     - Справа столбцом: кнопка mini accent «Принять» pill + ghost «×»

3. **Мои группы секция:**
   - Label uppercase «МОИ ГРУППЫ · 2»
   - Карточка группы `bg-white rounded-2xl border border-border p-4`:
     - Верхняя строка: большой квадратный avatar-placeholder 48px `rounded-xl` (для FAMILY — accent-muted с Home icon text-accent, для FRIENDS — sage-muted с Heart icon text-sage) + справа в колонку: название 16px font-bold, badge type (chip 2xs):
       - FAMILY: `bg-accent-muted text-accent border-accent/25` «FAMILY · Семья»
       - FRIENDS: `bg-sage/12 text-sage border-sage/30` «FRIENDS · Друзья»
     - Мета-строка снизу 12px text-3: «3 участника · 42 блюда · 18 в холодильнике» (для FAMILY) или «4 участника · 28 блюд» (для FRIENDS)
     - Стек аватарок участников `-space-x-2`: 3 первых initial-аватарки 28px с border-white bg-bg-3 text-accent font-bold, если больше — последний заменяется на +2 chip
     - Если owner — мелкая Crown icon accent 12px над своим аватаром
     - Tap на карточку → GroupDetailPage

4. **FAB:** pill «+ Создать группу» accent, bottom-20 right-4.

### Структура — GroupDetailPage

#### Состояние 4 — FAMILY, не owner

1. **Top bar 52px:** ChevronLeft слева, название «Семья Фелициас» центр, MoreVertical справа (для member — мало опций: только «Выйти»).

2. **Hero-блок** (в accent-muted контейнере `bg-accent-muted rounded-2xl mx-5 mt-4 p-5 border border-accent/20`):
   - Сверху: type-badge chip «FAMILY · Семья» accent + дата создания text-12 text-3 «С декабря 2025»
   - H1 «Семья Фелициас» 24px extrabold
   - Подзаголовок: «3 участника · Общий холодильник и план»
   - Метрики в ряд (MetaStrip-like): 42 блюда · 18 в холодильнике · 6 в плане

3. **Participants секция:**
   - SectionHeader «Участники · 3» 15px font-bold + справа ghost-кнопка «Пригласить +» accent 13px
   - Список участников — каждый в строке `bg-white rounded-xl border-border p-3 flex gap-3 items-center`:
     - Avatar initial 40px `bg-bg-3 border-border text-accent font-bold` 15px
     - Если OWNER — мелкая Crown icon accent сверху-справа аватара
     - Центр: имя 14.5px font-semibold, мета 11px text-3 «владелец · с декабря» / «участник · с января»
     - Если это я — chip 2xs «Это вы» accent-muted справа
   - Pending-строка (если есть email-invite): полупрозрачная карточка `bg-bg-3` с диагональной пунктирной иконкой, email и chip «ожидает»

4. **Invite-секция:** белая карточка `rounded-2xl p-4 border-border`:
   - SectionHeader mini «Пригласить в группу»
   - text-12 text-3 «Отправь эту ссылку — пригласитель вступит как participant»
   - Большой pill input readonly: `bg-bg-3 rounded-full pl-4 pr-2 py-2 flex items-center` — текст ссылки truncate + справа круглая accent-кнопка 32px с Copy icon. При клике — mini-toast «Скопировано ✓»
   - Две мелкие ghost-кнопки по центру: «Поделиться в Telegram» + «QR-код»

5. **Danger-зона (для member-view — только "Выйти из группы"):** в самом низу, красноватый ghost-вариант. `border-t border-border pt-5 px-5`:
   - Кнопка `text-[13px] text-red-600 font-semibold` с LogOut icon «Выйти из группы»

#### Состояние 5 — FAMILY, owner-view

То же что выше, но:

1. **В top bar** MoreVertical → dropdown (нарисуй открытый): «Переименовать», «Настройки», «Удалить группу» (последний — красный).

2. **В Participants-секции** — у каждого НЕ-себя члена — мини-MoreVertical справа (3 точки). Показать открытый для одного участника: dropdown с «Передать владение», «Удалить из группы» (красный).

3. **Danger-зона расширена:**
   - «Передать владение и выйти» ghost text-13 text-3
   - «Удалить группу навсегда» text-13 text-red-600 font-semibold с Trash2 icon

4. **Invite** — тот же блок, но ещё чуть заметнее (ему больше внимания как owner-owner фиче).

### Фишки для этих страниц

- **Два визуальных языка для типов**: FAMILY = accent (важнее, семья), FRIENDS = sage (светлее, друзья). Каждая карточка однозначно читается.
- **Стек аватарок** `-space-x-2` — быстрый способ показать «сколько нас». Красивее чем просто счётчик.
- **Pending-invite отдельным блоком сверху** — как inbox-паттерн. Это приоритет 1, пользователь должен сразу увидеть.
- **Invite-pill с readonly ссылкой** — компактный, работает как input, но не даёт редактировать. Copy-кнопка справа в самом пилле.
- **Mini Crown-иконка поверх аватарки owner** — не занимает места в строке, но сразу считывается.
- **Danger-зона внизу под border-top** — отделена, чтобы случайно не нажать.

### Варианты, которые можно попробовать

Если останется место — **два варианта карточки группы** в списке:
- **A** — как описано (квадрат-аватар слева + стек участников)
- **B** — горизонтальная карточка с hero-изображением сверху (как pinned-блок) и ярлыком типа

### Технические напоминания

- `export default`
- 5 состояний друг под другом, разделители `h-8 bg-gray-200` с подписью по центру: «1. Гость», «2. Пустой», «3. Список групп», «4. Детальная (member)», «5. Детальная (owner)»
- Моки инлайном
- useState только для open/close dropdown и toast при copy

### Не забудь

- Токены цвета — через объект `C` наверху файла
- `px-5` горизонтально на корне страницы, между секциями `mt-7`
- Заголовки без принудительных `<br />`
- `textWrap: 'pretty'` / `'balance'` на заголовках
- `tabular-nums` на числах
- Маленькие именованные компоненты с `// ═══` шапками
- Нижний отступ `pb-24` (под tab bar)
- Avatar участников: `bg-bg-3 border-border text-accent font-bold` (не accent-fill)
