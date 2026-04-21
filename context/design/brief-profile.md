# ТЗ для claude.ai/design — ProfilePage (Профиль)

Страница профиля пользователя. Аватар, имя/email, статус Pro, настройки, подключения (Telegram), язык, выход. Не админка — админку отдельной страницей.

---

## Промпт для claude.ai/design

Создай React-артефакт (`.jsx`) — страница профиля мобильного PWA MealBot.

### Общие правила артефакта (важно!)

- **Не рисуй header (52px сверху) и tab bar (64px снизу)** — они в Layout'е. Только контент. Внизу `pb-24`.
- **Токены цвета** собери в объект `C = { bg, card, bg3, border, accent, accentMuted, sage, sageMuted, sageBorder, text, text2, text3, pro, proMuted, proBorder, red }` в начале файла.
- **Отступы:** `px-5` горизонтально на корне. Между секциями `mt-7`.
- **Заголовки:** без принудительных `<br />`. `textWrap: 'pretty'`.
- **Числа:** `tabular-nums` на всех метриках (24 блюда, 18 избранных, 158 дней, серия 7).
- **Avatar юзера в Hero:** круг с initial, фон `bg-accent-muted text-accent font-extrabold`. Для Pro добавить `ring-2` с pro-цветом (`#B8935A`). Для Free — без ring'а.
- **MetaStrip (4 ячейки stats):** каждая ячейка = **иконка 16px text-accent + число + label uppercase** (иконка обязательна!).
- **Structure:** именованные компоненты с `// ═══ ... ══════` шапками. Один `Screen` с пропом `variant` ('guest' | 'free' | 'pro').

### Контекст

Пользователь зашёл в «Профиль» через tab-bar или меню. Хочет увидеть свой статус (Free/Pro), свои метрики («сколько блюд создал», «сколько дней с нами»), подключить Telegram, сменить язык, выйти. Для Pro-юзеров — бейдж и раздел «Моя подписка». Для Free — CTA-блок «Апгрейд на Pro».

Ключевое:
- Hero с аватаром + имя/email + badge Pro/Free
- Раздел статистики (Мои блюда, В избранном, Дней с MealBot, Серия готовки)
- Pro-upgrade плашка (если Free) ИЛИ блок «Моя подписка» (если Pro)
- Раздел «Подключения» — Telegram (подключён/не подключён)
- Раздел «Настройки» — Язык, Уведомления (свитчер), О приложении
- Раздел «Действия» — Выход, Удалить аккаунт

### Ограничения

Мобильный first, одиночный `.jsx`, Tailwind core + hex inline, `lucide-react`, `useState`.

Иконки: User, Crown, Settings, Globe, Bell, Info, LogOut, Trash2, ChevronRight, Check, X, Mail, MessageCircle (Telegram), Sparkles, Flame, Heart, Calendar, ChefHat, Zap.

### Дизайн-система (reference)

Цвета: `#F6F4EF` / `#FFFFFF` / `#F5EFE6` / `#E5D8C8`. Акцент `#C4704A`, accent-muted `rgba(196,112,74,0.1)`. Sage `#5C7A59`, sage-muted `rgba(92,122,89,0.08)`. **Pro gold `#B8935A`, pro-muted `rgba(184,147,90,0.12)`, pro-border `rgba(184,147,90,0.35)`.** Text `#1C1917`/`#78716C`/`#A8A29E`. Red для destructive `#D14343`. Nunito.

Радиусы: pill для кнопок/chip, rounded-2xl для карточек, rounded-xl для sub-блоков, rounded-full для аватара.

Типографика: H1=26px extrabold, H2=17px bold, label uppercase 10-11px tracking-wide text-2.

### Состояния экрана

В одном артефакте **три состояния**:

1. **Гость** — нет профиля, просто CTA на регистрацию
2. **Free-юзер** — с Pro-upgrade плашкой, Telegram не подключён
3. **Pro-юзер** — с golden-бейджем и блоком «Моя подписка», Telegram подключён

### Данные (мок)

```js
const USERS = {
  free: {
    name: 'Марина Фелициас',
    email: 'smfelicitasm@gmail.com',
    avatarInitial: 'М',
    isPro: false,
    joinedAt: '2025-11-14',
    stats: { dishes: 24, favorites: 18, days: 158, streak: 7 },
    telegramConnected: false,
    locale: 'ru',
    notifications: true,
  },
  pro: {
    name: 'Марина Фелициас',
    email: 'smfelicitasm@gmail.com',
    avatarInitial: 'М',
    isPro: true,
    proSince: '2026-02-10',
    proPlan: 'ежемесячная',
    proNextBill: '2026-05-10',
    joinedAt: '2025-11-14',
    stats: { dishes: 24, favorites: 18, days: 158, streak: 7 },
    telegramConnected: true,
    telegramUsername: '@marina_f',
    locale: 'ru',
    notifications: true,
  },
};

const LANGUAGES = [
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'en', label: 'English',  flag: '🇬🇧' },
];
```

### Структура экрана

#### Состояние 1 — Гость

Центрированный блок:
- Круг 80px bg-bg-3 с User icon 32px text-3
- H2 «Войдите в аккаунт» 17px bold
- text-14 text-2 leading-relaxed «Чтобы хранить свои блюда, план и холодильник — создайте аккаунт или войдите»
- Две кнопки:
  - Primary «Создать аккаунт» accent
  - Secondary «Войти»
- Ниже мелкий text-3 12px «Зачем это нужно? Данные синхронизируются между устройствами и сохранятся»

#### Состояние 2 — Free-юзер

1. **Hero** (белая карточка rounded-2xl p-5 mx-5 mt-4):
   - Верх: avatar 72px кружок `bg-accent-muted text-accent font-extrabold text-[28px] border-2 border-white` + тень мягкая. Позиция — слева или по центру (выбери что лучше смотрится).
   - Имя «Марина Фелициас» 20px font-extrabold под/рядом
   - Email 13px text-3 «smfelicitasm@gmail.com»
   - Статус-чип: `bg-bg-3 border-border text-text-2 text-11 font-bold uppercase tracking-wide px-2.5 py-1 rounded-full` «FREE»
   - Мелкий text-12 text-3 «С нами с 14 ноября 2025»

2. **Stats MetaStrip:** 4 ячейки `grid grid-cols-4 gap-2` в белом контейнере rounded-2xl p-3 border-border:
   - Каждая: иконка 16px text-accent + число 18px font-extrabold + подпись 10px text-3 uppercase tracking-wide
   - Блюда 24 (ChefHat) · Избранных 18 (Heart) · Дней 158 (Calendar) · Серия 7 🔥 (Flame)
   - Последняя с акцентом sage (если streak > 0)

3. **Pro-upgrade плашка:** `bg-pro-muted border border-pro/35 rounded-2xl p-5` — золотая:
   - Верх: Crown icon 24px text-pro + H3 «MealBot Pro» 17px bold
   - text-13 text-2 leading-relaxed «Безлимитный ИИ-чат, расширенные рекомендации, приоритетная поддержка»
   - Список плюшек (3 строки с Check-иконкой 14px text-pro): «Безлимитный ИИ-помощник», «Расширенный анализ холодильника», «Приоритетная поддержка»
   - Primary-кнопка `bg-pro text-white` pill «Попробовать Pro — 499 ₽/мес»
   - Ghost-ссылка text-12 text-3 по центру «Подробнее о Pro»

4. **Подключения секция:**
   - SectionHeader label uppercase «ПОДКЛЮЧЕНИЯ»
   - Telegram-ряд (белая карточка rounded-2xl p-4 flex items-center gap-3):
     - Круг 40px rounded-full bg-[#229ED9] с inline-SVG или MessageCircle icon white
     - Центр: «Telegram-бот» 14.5px font-semibold, text-12 text-3 «Управляй приложением прямо в Telegram»
     - Справа: chip-кнопка «Подключить» accent pill mini

5. **Настройки секция:**
   - SectionHeader label uppercase «НАСТРОЙКИ»
   - Настройки как list rows (белые карточки rounded-xl p-4 flex items-center gap-3, gap-2 между):
     - Globe icon 18px text-accent | «Язык интерфейса» 14px | справа «Русский 🇷🇺» text-3 13px + ChevronRight 16px text-3
     - Bell icon text-accent | «Уведомления» | справа Toggle-switch (on/off) — рисуем вручную: `w-10 h-6 rounded-full bg-accent relative` + кружок 20px white.
     - Info icon text-accent | «О приложении» | ChevronRight

6. **Действия секция:**
   - SectionHeader label uppercase «АККАУНТ»
   - Ряд выхода: `bg-white rounded-xl p-4 flex items-center gap-3 border border-border` с LogOut icon 18px text-text-2, «Выйти» 14px text-text
   - Ряд удаления: то же но с Trash2 icon text-red-600, «Удалить аккаунт» text-red-600 font-semibold
   - Ниже мелкий text-11 text-3 по центру «MealBot v2.4.0 · [условия] · [приватность]»

#### Состояние 3 — Pro-юзер

Всё как выше, но:

1. **Hero** — вокруг аватара тонкая golden-рамка `border-2 border-pro`. Status chip меняется на `bg-pro-muted border border-pro/35 text-pro font-extrabold uppercase tracking-wide` с Crown icon — «PRO».

2. **Вместо Pro-upgrade — блок "Моя подписка"** `bg-white rounded-2xl p-5 border border-pro/25`:
   - Crown icon text-pro 20px + H3 «MealBot Pro» 17px bold + мелкий chip pro-muted «активна»
   - 2 строки мета-инфо: «Ежемесячная · 499 ₽» | «Следующее списание: 10 мая 2026»
   - Две ghost-кнопки в ряд: «Управлять» accent + «Отменить» text-red-600

3. **Telegram-ряд — подключено:**
   - Справа chip success-style «Подключено ✓» sage-muted pill mini
   - Телеграм-имя под меткой «@marina_f» 12px text-3

### Фишки для этой страницы

- **Золотой Pro-бейдж вокруг аватара** — видно сразу при открытии, не надо искать.
- **Stats как MetaStrip с 4 ячейками и иконками** — быстрый визуальный профиль активности.
- **Streak с эмодзи 🔥** и sage-подсветкой — gamification-штрих.
- **Pro-upgrade плашка золотым цветом** отдельно от accent — чтобы не путалось с бытовыми действиями.
- **Toggle-switch для уведомлений** — нарисованный вручную, не input type=checkbox. Анимация не обязательна, но состояние на/off — обязательно.
- **Danger-блок в самом низу с мелким шрифтом** — не выделяется, чтобы случайно не нажать.

### Варианты, которые можно попробовать

Если будет место — **два варианта hero-карточки**:
- **A** — аватар слева, имя+email справа в колонку (компактно)
- **B** — аватар по центру сверху, имя по центру снизу (более "профильный" вид)

### Технические напоминания

- `export default`
- 3 состояния друг под другом, разделители с подписью
- Моки инлайном
- useState для toggle-notifications и language-dropdown
- Toggle-switch — простое `<div>` с `bg-accent/bg-border` + абсолютный круг, меняется через `transition-all translate-x`

### Не забудь

- Токены цвета — через объект `C` наверху файла
- `px-5` горизонтально на корне страницы, между секциями `mt-7`
- Заголовки без принудительных `<br />`
- `textWrap: 'pretty'` на заголовках
- `tabular-nums` на всех stats
- Маленькие именованные компоненты с `// ═══` шапками
- Нижний отступ `pb-24` (под tab bar)
- В MetaStrip у каждой метрики **обязательно** иконка 16px text-accent
