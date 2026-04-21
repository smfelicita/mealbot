# ТЗ для claude.ai/design — AuthPage (Регистрация и вход)

Страница авторизации. Два режима: вход и регистрация. Email+пароль. Поддержка invite-code (если открыли через ссылку-приглашение). Telegram-кнопка. Режимы переключаются табами.

---

## Промпт для claude.ai/design

Создай React-артефакт (`.jsx`) — страница авторизации мобильного PWA MealBot.

### Общие правила артефакта (важно!)

- **Не рисуй основной app-header (52px) и tab bar** — страница auth вообще без tab bar, но свой top-bar 52px с ArrowLeft и Skip описан ниже, его оставляем.
- **Токены цвета** собери в объект `C = { bg, card, bg3, border, accent, accentMuted, sage, text, text2, text3, tg: '#229ED9', red: '#D14343', redMuted }` в начале файла.
- **Отступы:** `px-5` горизонтально на корне. Между секциями `mt-6` или `mt-7` (на auth можно чуть плотнее).
- **Заголовки:** без принудительных `<br />`. `textWrap: 'balance'` на H1.
- **Input:** `tabular-nums` не нужен (там текст). Но на иконках в инпутах — размер 18px text-3.
- **Structure:** именованные компоненты с `// ═══ ... ══════` шапками. Один `Screen` с пропом `variant` ('register' | 'register-invite' | 'login' | 'errors').

### Контекст

Пользователь попал на страницу регистрации/входа — либо сам открыл, либо его перебросили с гостевого CTA, либо он кликнул invite-ссылку от другого юзера.

Сценарий регистрации:
- Ввёл имя, email, пароль → получил доступ к приложению как FREE-юзер
- Если пришёл по invite-ссылке — после регистрации автоматически вступает в группу

Сценарий входа:
- Email + пароль → попал в приложение

Ключевое:
- Два режима переключаемых табами: **Вход** / **Регистрация**
- Поддержка `?mode=register` в URL-параметре (начальное состояние — Регистрация)
- Если есть invite-preview (из URL) — над формой показываем «Вас приглашают в Семья Фелициас» блок
- Validation inline: email format, password length ≥ 8
- Показ/скрытие пароля eye-иконкой
- Alternative: Telegram login кнопка (синий Telegram-стиль)

### Ограничения

Мобильный first, одиночный `.jsx`, Tailwind core + hex inline, `lucide-react`, `useState`.

Иконки: Mail, Lock, User, Eye, EyeOff, ChevronRight, Check, X, AlertCircle, MessageCircle, ArrowLeft, Users.

### Дизайн-система (reference)

Цвета: `#F6F4EF` / `#FFFFFF` / `#F5EFE6` / `#E5D8C8`. Акцент `#C4704A`, accent-muted `rgba(196,112,74,0.1)`. Sage `#5C7A59`, sage-muted `rgba(92,122,89,0.08)`. Telegram `#229ED9`. Red destructive `#D14343`, red-muted `rgba(209,67,67,0.08)`. Text `#1C1917`/`#78716C`/`#A8A29E`. Nunito.

Радиусы: pill для кнопок, rounded-2xl для input-групп и карточек, rounded-xl для sub-блоков.

Типографика: H1=26px extrabold, H2=17px bold, label uppercase 10-11px tracking-wide text-2.

### Состояния экрана

В одном артефакте **четыре состояния** друг под другом:

1. **Регистрация** — пустые поля
2. **Регистрация + invite-preview** — баннер «вас приглашают» сверху
3. **Вход** — с пустыми полями
4. **Регистрация с ошибками валидации** — email неверный, пароль короткий

### Данные (мок)

```js
const INVITE_PREVIEW = {
  groupName: 'Семья Фелициас',
  groupType: 'FAMILY',
  inviterName: 'Дима',
  inviterInitial: 'Д',
  memberCount: 3,
};
```

### Структура экрана

#### Общий layout

Каждое состояние — самостоятельный "экран" во фрейме `min-h-[700px]`, со своей подписью-разделителем.

Внутри:
1. **Top bar** 52px: слева ArrowLeft (ghost), в центре пусто, справа skip-кнопка text-3 «Пропустить» (только для регистрации) → ведёт в guest-mode
2. **Hero-блок:**
   - Большой текст приветствия:
     - Регистрация: H1 «Добро пожаловать в MealBot» 26px extrabold leading-tight (в 2 строки)
     - Вход: H1 «С возвращением!» 26px extrabold
   - Подзаголовок 14px text-2 leading-relaxed:
     - Регистрация: «Создай аккаунт чтобы сохранять блюда, план и делиться с семьёй»
     - Вход: «Введи свой email и пароль»
3. **Табы переключения** — segmented control pill:
   - `bg-bg-3 rounded-full p-1 flex gap-1 w-full`
   - Два tab'а: «Вход» | «Регистрация» — каждый `flex-1 py-2.5 rounded-full text-14 font-semibold text-center`
   - Активный: `bg-white shadow-sm text-text`, неактивный: `text-text-2`
4. **Форма** — ниже табов, отступ 24px

#### Состояние 1 — Регистрация

Форма с полями `flex flex-col gap-3`:

- **Имя:**
  - Label: «Как тебя зовут?» 13px text-2 font-semibold mb-1.5
  - Input group: `bg-white rounded-2xl border border-border px-4 py-3 flex items-center gap-3`:
    - User icon 18px text-3
    - `<input>` 14.5px `bg-transparent outline-none flex-1` placeholder «Марина»
- **Email:**
  - Label: «Email» 13px
  - Input group с Mail icon text-3, placeholder «you@example.com»
- **Пароль:**
  - Label: «Пароль»
  - Input group с Lock icon text-3, placeholder «Минимум 8 символов», type="password"
  - Справа — Eye icon 18px text-3 (клик-toggle показа пароля)
  - Под инпутом — мелкая hint-строка text-12 text-3 «Минимум 8 символов, буквы и цифры»

- **Primary-кнопка** во всю ширину (h-12 не h-11): «Создать аккаунт» accent pill
- **Mini "или":** `flex items-center gap-3 my-4`: `flex-1 h-px bg-border` + text-12 text-3 uppercase «ИЛИ» + `flex-1 h-px bg-border`
- **Telegram-кнопка:** secondary-стиль но с Telegram-цветом: `bg-white border border-[#229ED9]/30 text-[#229ED9] h-12 rounded-full flex items-center justify-center gap-2` + MessageCircle icon + «Войти через Telegram»
- **Внизу:** text-13 text-2 по центру: «Уже есть аккаунт? » + link accent «Войти»
- **Мелким шрифтом в самом низу:** text-11 text-3 «Нажимая "Создать аккаунт", я соглашаюсь с [Условиями] и [Политикой]»

#### Состояние 2 — Регистрация с invite-preview

Всё как в состоянии 1, но **над формой (после Hero)** — invite-preview плашка:

`bg-accent-muted border border-accent/25 rounded-2xl p-4 flex gap-3 items-center`:
- Круг 40px rounded-xl bg-white с avatar-initial «Д» text-accent font-bold
- Центр:
  - Мелкий label 11px text-accent uppercase font-bold tracking-wide «ПРИГЛАШЕНИЕ»
  - Основной текст 14px font-semibold: «Дима зовёт тебя в **Семья Фелициас**»
  - text-12 text-3: «FAMILY · 3 участника»
- Справа: Users icon 24px text-accent

И меняется заголовок формы H1: «Присоединяйся к MealBot» (более тёплый CTA)
Primary-кнопка: «Создать аккаунт и присоединиться»

#### Состояние 3 — Вход

Форма проще:
- Email (Mail icon, placeholder «you@example.com»)
- Пароль (Lock icon, Eye toggle)
- Справа от label пароля мелкая ghost-ссылка text-12 text-3 «Забыли пароль?»
- Primary «Войти» accent
- «или» + Telegram-кнопка
- Внизу: «Нет аккаунта? » + link «Регистрация»

#### Состояние 4 — Регистрация с ошибками

Показать оба inline-ошибки:

- **Email input** — border красный `border-red-500` + Mail icon text-red-500. Под инпутом красная строка `text-12 text-red-600 mt-1.5 flex items-center gap-1` с AlertCircle icon 12px и текстом «Введите корректный email»
- **Пароль input** — аналогично. Ошибка: «Пароль должен быть не менее 8 символов»
- **Сверху формы** (опционально) — общий error-toast `bg-red-50 border border-red-200 rounded-xl p-3 flex gap-2 text-13 text-red-700`: AlertCircle + «Проверьте введённые данные»

Кнопка Primary — не disabled, но без проверки вернёт в эту ошибку.

### Фишки для этой страницы

- **Invite-preview плашка** над формой — сразу понятно зачем ты регистрируешься. Иначе пользователь может испугаться «зачем мне это приложение».
- **Segmented control табы** для переключения Вход/Регистрация — а не две отдельных страницы. Меньше когнитивной нагрузки.
- **Eye toggle** на пароле — стандарт UX для мобильных.
- **Telegram-логин** отдельной кнопкой — альтернативный вход, сразу видимый. MealBot тесно интегрирован с Telegram — важная фича.
- **Красные inline-errors** конкретно под каждым полем — не общий toast. Сразу видно что чинить.
- **Mini "или"** разделитель — визуально отделяет email-flow от Telegram-flow.

### Варианты, которые можно попробовать

Если есть место — **два варианта inputs**:
- **A** — как описано (border-based, icon внутри)
- **B** — underline-стиль (без border, только нижняя полоска, label вверху) — более минималистичный

### Технические напоминания

- `export default`
- 4 состояния друг под другом, разделители `h-8 bg-gray-200` с подписью по центру
- Моки инлайном
- useState для: isLogin (tab), showPassword, formValues
- Валидация — визуальная (нарисуй состояния). Логика может быть примитивной: регex для email, length ≥ 8 для пароля.
- Invite-preview показывается только в состоянии 2

### Не забудь

- Токены цвета — через объект `C` наверху файла
- `px-5` горизонтально на корне страницы
- Заголовки без принудительных `<br />`
- `textWrap: 'balance'` на H1
- Маленькие именованные компоненты с `// ═══` шапками
- Invite-preview (состояние 2) — мок-объект INVITE_PREVIEW сверху, условный рендер через variant
