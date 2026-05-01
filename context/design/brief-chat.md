# ТЗ для claude.ai/design — ChatPage (ИИ-помощник)

Чат с ИИ для подбора блюд. Сообщения-bubbles, typing-indicator, inline-карточки блюд в ответах, быстрые подсказки, счётчик для гостей, Pro-upgrade плашка при исчерпании лимита.

---

## Промпт для claude.ai/design

Создай React-артефакт (`.jsx`) — страница ИИ-чата мобильного PWA MealBot.

### Общие правила артефакта (важно!)

- **Не рисуй основной header (52px сверху) и tab bar (64px снизу)** — они есть в Layout'е приложения. Нарисуй только контент страницы (mini top-bar внутри чата — его оставляем, он описан ниже). Внизу оставь `pb-24` отступ.
- **Токены цвета** собери в объект `C = { bg, card, bg3, border, accent, accentMuted, accentBorder, sage, sageMuted, text, text2, text3, pro, proMuted, proBorder }` в начале файла.
- **Отступы:** горизонтально `px-5` на корневом wrapper'е. Между крупными секциями `mt-7`. Внутри чата между сообщениями — `gap-3`.
- **Заголовки:** без принудительных `<br />`. `textWrap: 'pretty'`.
- **Числа:** `tabular-nums` для счётчика «3 из 50», времени, калорий.
- **Avatar** (если нужен в empty-state): `bg-bg-3 border border-border text-accent font-bold`.
- **Structure:** именованные компоненты с `// ═══ ... ══════` шапками. Один `Screen` с пропом `variant` ('guest' | 'empty' | 'active' | 'limit').

### Контекст

У пользователя есть холодильник и список любимых блюд. Он открывает чат и спрашивает у ИИ «что приготовить» в свободной форме. ИИ отвечает текстом + подсовывает inline-карточки блюд из базы. Примеры запросов: «хочу что-то быстрое», «что приготовить на ужин из курицы», «дай рецепт лёгкого супа».

Лимиты:
- **Гость:** 2 сообщения в день — блокируется с CTA на регистрацию
- **Юзер (free):** 50 сообщений в день — при исчерпании показывается плашка «Апгрейд на Pro — безлимит»
- **Pro:** без лимитов + возможность задавать вопросы вне базы рецептов

### Ограничения

Мобильный first, одиночный `.jsx`, Tailwind core + hex inline, `lucide-react`, `useState`.

Иконки: Sparkles, ArrowUp, Trash2, Crown (для Pro), Lock, ChevronRight, MessageSquare.

### Дизайн-система (reference)

Цвета: `#F6F4EF` / `#FFFFFF` / `#F5EFE6` / `#E5D8C8`. Акцент `#C4704A`, accent-muted `rgba(196,112,74,0.1)`. Sage `#5C7A59`, sage-muted `rgba(92,122,89,0.08)`. Text `#1C1917`/`#78716C`/`#A8A29E`. Pro-цвет **золото `#B8935A`**, pro-muted `rgba(184,147,90,0.12)`. Nunito.

Радиусы: pill для кнопок, rounded-2xl для bubble карточек, rounded-xl для sub.

Типографика: H1=26px extrabold (но на chat-page не нужен — страница без hero-header, сразу чат). H2=17px bold. Body 14px. Meta 11–12px text-3.

Кнопки pill. Chip primary-active = accent-muted/accent/25.

### Состояния экрана

В одном артефакте **четыре состояния** друг под другом:

1. **Гость (не залогинен)** — CTA блок с описанием фичи
2. **Пустой чат (залогинен, 0 сообщений)** — приветствие + быстрые подсказки
3. **Активный чат (диалог из 4 сообщений)** — bubbles с inline-карточками блюд + typing indicator
4. **Лимит исчерпан (free-юзер)** — Pro-upgrade плашка вместо input-bar

### Данные (мок)

```js
const SUGGESTIONS = [
  'Что приготовить на завтрак?',
  'Хочу что-то лёгкое на обед',
  'Быстрый ужин за 15 минут',
  'Вегетарианский вариант',
  'Что можно из яиц и молока?',
];

const MESSAGES = [
  {
    id: 1,
    role: 'user',
    content: 'Хочу приготовить что-то быстрое из курицы',
  },
  {
    id: 2,
    role: 'assistant',
    content: 'Смотри, из того что есть в твоём холодильнике, могу предложить несколько быстрых вариантов с курицей:',
    dishes: [
      { id: 'a', name: 'Курица с грибами в сливочном соусе', img: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=300', time: 25, cal: 420 },
      { id: 'b', name: 'Курица терияки с рисом', img: 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=300', time: 30, cal: 480 },
    ],
  },
  {
    id: 3,
    role: 'user',
    content: 'А совсем быстро, минут 15?',
  },
  {
    id: 4,
    role: 'assistant',
    content: 'Тогда вот — **куриные шашлычки на сковороде**. 15 минут, ничего сложного:',
    dishes: [
      { id: 'c', name: 'Быстрые куриные шашлычки', img: 'https://images.unsplash.com/photo-1552332386-f8dd00bc2f85?w=300', time: 15, cal: 290 },
    ],
  },
];

const userName = 'Марина';
const messagesLeft = 3; // показывается в верхнем правом углу
const isPro = false;
```

### Структура экрана

Страница — full-height, между header (52px) и tab bar (64px). Используй фрейм с `min-h-[700px]` и показывай 4 состояния одно под другим.

#### Общий mini top-bar (shared)

Над контентом чата — тонкая строка 44px: слева Sparkles + «ИИ-помощник» `font-bold text-15`, справа — «3 из 50» мелким text-3 (счётчик для free) или бейдж «Pro» (для Pro). `border-b border-border`. В состоянии 3 — справа мелкая ghost-кнопка Trash2 «Очистить».

#### Состояние 1 — Гость

Центрированный блок по центру экрана. Белая карточка `rounded-2xl p-6 border border-border`:
- Большой круг accent-muted (80px) с Sparkles внутри (accent-иконка)
- H2 «ИИ-помощник» 17px bold
- text-14 text-2 `leading-relaxed` «Подберу блюда с учётом твоего холодильника и предпочтений. Доступно после регистрации.»
- Primary-кнопка «Зарегистрироваться бесплатно»
- Ghost text-2 «Уже есть аккаунт? Войти»

Снизу — disabled input (та же pill-форма) с замочком Lock в кнопке отправки.

#### Состояние 2 — Пустой

Центрированный welcome блок:
- Sparkles 40px text-accent
- H2 «ИИ-помощник» 17px bold
- text-14 text-2 «Расскажи, что хочешь съесть — подберу варианты с учётом твоего холодильника»

Ниже — список подсказок-suggestion-cards:
- Каждая: `bg-white rounded-2xl border border-border px-4 py-3 flex items-center justify-between`
- Текст 14px text-2 + ChevronRight справа 16px text-3
- Хэштег-категория иконкой слева (ArrowRight или маленький accent-круг) — опционально

#### Состояние 3 — Активный чат

Сообщения сверху вниз в column `gap-3`:
- **User bubble:** `self-end max-w-[85%] bg-accent text-white rounded-2xl rounded-br-md px-3.5 py-2.5 text-14 leading-relaxed`
- **Assistant bubble:** `self-start max-w-[85%] bg-white border border-border rounded-2xl rounded-bl-md px-3.5 py-2.5 text-14 text-text leading-relaxed`
- **Inline dish cards** (внутри assistant bubble, после текста):
  - mt-2.5 flex flex-col gap-1.5
  - Каждая — компактная карточка: `bg-bg-3 rounded-xl p-2 flex gap-2.5 items-center`
  - Фото `w-12 h-12 rounded-lg` слева
  - Название 13px font-semibold + мета-строка 11px text-3 (Clock+время, Flame+cal)
  - ChevronRight 14px text-3 справа
- **Typing indicator** под последним сообщением: bubble-стиль assistant + 3 точки animate-bounce text-3
- **Markdown bold** в тексте (`**text**`) — жирный accent-muted выделение

#### Состояние 4 — Лимит исчерпан

Вместо input-bar снизу:
- `bg-pro-muted border border-pro/30 rounded-2xl p-4`
- Иконка Crown 20px text-pro сверху-центр
- H3 «Достигнут дневной лимит» 15px bold
- text-13 text-2 «Апгрейд на Pro — безлимитный ИИ-чат и доступ к фичам Pro-уровня»
- Primary-кнопка pro-стиля `bg-pro text-white` «Попробовать Pro»
- Ghost-ссылка «Узнать больше»

#### Общий input bar (состояния 2 и 3)

Снизу фиксированной ширины блок:
- `border-t border-border bg-bg px-3 py-2.5 flex items-end gap-2`
- Pill input: `flex-1 bg-white border border-border rounded-full pl-4 pr-2 py-2 text-14`. Placeholder «Спросить про блюда...». При фокусе — accent-border.
- Справа круглая кнопка отправки: `w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center`. Иконка ArrowUp 18px. Disabled (`bg-border cursor-not-allowed`) если input пустой.

### Фишки для этой страницы

- **Suggestion cards, не pills** — для гостя/пустого чата. Длиннее текст, читается как вопрос с ChevronRight «жмякни меня».
- **Inline dish cards в bubble** — компактная строка внутри assistant-сообщения. Не полная DishCard.
- **Pro-upgrade в 4-м состоянии** — тёмное золото (pro-цвет), не accent. Это чёткий визуальный маркер что это платная фича.
- **Bold markdown в ответах ИИ** — простой accent-bold без изменения background.
- **Счётчик "3 из 50"** в top-bar — ненавязчиво, text-3, чтобы напомнить о лимите но не пугать.
- **Pro-бейдж** когда isPro — золотой chip с Crown иконкой.

### Варианты, которые можно попробовать

Если останется место — попробуй **два варианта inline-dish-card** в сообщении ИИ:
- **A** — компактная строка как описано (фото + 2 строки текста + chevron)
- **B** — мини-карточка-горизонталка с чуть более крупным фото и тегами (что быстрее, чем клик-чтение)

Подпиши какой где.

### Технические напоминания

- `export default`
- 4 состояния друг под другом в device-frame
- Моки инлайном, useState для input/messages
- Без localStorage
- Typing dots — 3 span'а с `animate-bounce` и `animationDelay` 0/150/300ms

### Не забудь

- Токены цвета — через объект `C` наверху файла
- `px-5` горизонтально на корне страницы, между секциями `mt-7`
- Заголовки без принудительных `<br />`
- `textWrap: 'pretty'` на body/заголовках
- `tabular-nums` на числах (счётчик сообщений и т.п.)
- Маленькие именованные компоненты с `// ═══` шапками
- Нижний отступ `pb-24` (под tab bar), input-bar не фикс — нарисуй в flow
