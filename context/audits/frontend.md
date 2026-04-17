# Frontend — аудит

## 1. Текущее состояние

React + Vite + PWA. Tailwind v4. Тема: светлая, фон `#F6F4EF`.

**Структура компонентов:**
- `/components/ui` — базовые: Button, Loader, EmptyState, Modal, Avatar, Toast, SearchInput, InstallPrompt
- `/components/domain` — бизнес: DishCard (grid/row/inline), DishIngredientPicker, CommentsSection, MealTypeChips, IngredientList, OnboardingModal, GroupHeader, GroupCard, PlanItem
- `/pages` — экраны
- `/hooks` — useToast, useHintDismiss
- `/api/index.js` — все API-вызовы через единую функцию `request()`
- `/store/index.js` — Zustand (user, token, fridge, chatMessages)

**Design tokens (tailwind.config.js):**
- Цвета: `bg`, `bg-2`, `bg-3`, `text`, `text-2`, `text-3`, `border`, `accent`, `sage`, `teal`
- Тени: `shadow-card`, `shadow-sm`, `shadow-md`, `shadow-accent`, `shadow-sage`, `shadow-top`
- Шрифт: `text-2xs` (10px)

## 2. Найденные проблемы

| Проблема | Приоритет |
|---|---|
| Дублирующийся `InstallPrompt` в двух местах | high |
| `TopBar` и `BottomTabBar` — мёртвый код, нигде не используется | high |
| `ProfileModal` — кастомный оверлей вместо стандартного `Modal` | medium |
| `DishIngredientPicker` вшит в `DishFormPage` (75 строк) | medium |
| Inline styles вместо Tailwind: color, background, boxShadow | high |
| `sage` в config = `#4A6B47`, в коде везде `#5C7A59` | medium |
| Произвольные `text-[Npx]` вместо именованных классов | low |

## 3. Решения

- Удалить `TopBar`, `BottomTabBar` полностью
- Перенести `InstallPrompt` в `/components/ui`
- `ProfileModal` — переделать через `<Modal>` (bottom sheet)
- Вынести `DishIngredientPicker` в `/components/domain`
- Все inline styles → Tailwind utility classes
- Исправить `sage` в config на `#5C7A59`
- `text-[12px]` → `text-xs`, `text-[14px]` → `text-sm` и т.д. (где есть аналог)

## 4. Реализация

Фаза 1 (аудит 3–5, коммит `b464d92`):
- Удалены: `TopBar.jsx`, `BottomTabBar.jsx`, `components/InstallPrompt.jsx`
- Созданы: `components/ui/InstallPrompt.jsx`, `components/domain/DishIngredientPicker.jsx`
- Исправлены: 23 файла, −408/+322 строк
- Добавлены токены в `tailwind.config.js`: sage, teal, shadows, text-2xs

Фаза 2 (фронтенд-аудит 10 задач, апрель 2026):
- `TelegramAuthPage` переписан на Tailwind, нет легаси CSS
- `GroupHeader` вынесен в `/components/domain`
- `GroupCard` вынесен в `/components/domain`
- `PlanItem` вынесен в `/components/domain`
- `DishCard`: добавлен `getDishMeta()` хелпер, добавлен `variant="inline"` (InlineCard для чата)
- `MealTypeChips`: `bg-sage` вместо inline style `background: #5C7A59`
- SVG: все hardcoded цвета → `currentColor`, цвет задаётся через Tailwind класс на wrapper
- `text-[11px]` → `text-2xs` (массовая замена)
- `useToast` + error states на HomePage, DishesPage, DishDetailPage, GroupsPage
- Email-валидация в форме приглашения в группу (regex на клиенте)

## 5. Открытые вопросы

- Размеры `text-[13px]`, `text-[15px]`, `text-[17px]`, `text-[22px]`, `text-[24px]`, `text-[26px]` — нужны именованные токены в tailwind.config (text-[11px] уже заменён на text-2xs)

## 6. Договорённости

- **Никаких inline styles.** Только Tailwind utility classes.
- **Никаких новых CSS-переменных** — только токены из `tailwind.config.js`.
- **Компонент одной отвечает за одно.** Логика пикера не живёт в форме.
- `InstallPrompt` — только из `/components/ui`.
- `DishCard` — единственная карточка блюда. Варианты: `grid` (дефолт), `row`, `inline`.
- `Modal` — единственный способ делать оверлеи и bottom sheet.
- SVG — всегда `stroke="currentColor"`, цвет через Tailwind на обёртке.
