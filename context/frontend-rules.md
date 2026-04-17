# Frontend — правила внесения изменений

## 1. Где что лежит

```
frontend/src/
├── pages/          — экраны (один файл = один роут)
├── components/
│   ├── ui/         — базовые компоненты БЕЗ бизнес-логики
│   └── domain/     — компоненты с логикой предметной области
├── hooks/          — переиспользуемые хуки
├── api/index.js    — ВСЕ API-вызовы, только здесь
├── store/index.js  — Zustand (user, token, fridge, chatMessages)
└── lib/            — утилиты
```

**`/components/ui` — что здесь:**
Button, Loader, EmptyState, Modal, Avatar, Toast, SearchInput, InstallPrompt, TextInput

**`/components/domain` — что здесь:**
DishCard, DishIngredientPicker, CommentsSection, MealTypeChips, IngredientList, OnboardingModal, GroupHeader, GroupCard, PlanItem

## 2. Как вносить изменения в UI

Перед любой правкой:

1. Найти существующий компонент в `/components/ui` или `/components/domain`
2. НЕ создавать новый, если можно переиспользовать
3. НЕ дублировать UI — если похожее уже есть, переиспользуй или обобщи

Если нужен новый компонент:
- Убедиться, что его точно нет
- Базовый (без бизнес-логики) → `/components/ui`
- С логикой предметной области → `/components/domain`
- Добавить в `index.js` соответствующей папки
- Имя: `PascalCase`, файл `.jsx`

## 3. Правки дизайна

**Цвета — только через токены:**
```
text-text / text-text-2 / text-text-3
bg / bg-bg-2 / bg-bg-3
text-accent / bg-accent
text-sage / bg-sage
border-border
```
Никаких `#HEX` в JSX. Никаких `style={{ color: ... }}`.

**Тени — только через токены:**
```
shadow-card   — карточки
shadow-sm     — лёгкие тени
shadow-md     — модалки
shadow-accent — акцентные кнопки
shadow-sage   — sage-кнопки
shadow-top    — нижние оверлеи
```
Никаких `style={{ boxShadow: ... }}`.

**Spacing:**
- Между карточками: `gap-3`
- Паддинги контейнера: `px-4` или `px-5`
- Контент-секция: `pt-4 pb-8`

**Никаких inline styles** — если нет нужного класса, добавить токен в `tailwind.config.js`.

## 4. Карточки и списки блюд

- Единственная карточка блюда: `<DishCard>`
- Не создавать альтернативных карточек
- Варианты: `variant="grid"` (дефолт, вертикальная), `variant="row"` (горизонтальная), `variant="inline"` (компактная для чата)

## 4а. SVG иконки

- Всегда `stroke="currentColor"` (не hardcoded `#HEX` и не `rgba(...)`)
- Цвет задаётся Tailwind-классом на родительском элементе: `<div className="text-accent"><svg ...>`)
- `fill="currentColor"` — для заливочных иконок
- Никаких `style={{ color: ... }}` на SVG

## 5. Формы

- Кнопка submit: `<Button loading={saving}>Сохранить</Button>`
- Ошибки: Toast через `useToast()` для серверных, под полем для валидации
- Обязательные поля: обрабатываются на уровне submit, не через атрибут required
- Стиль инпута: `bg-bg-3 border border-border rounded-sm text-text text-sm px-3 py-2 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20`

## 6. Состояния экрана

Каждый экран обязан иметь:

| Состояние | Как реализовать |
|---|---|
| loading | `<Loader />` или `<SkeletonCard />` для списков |
| empty | `<EmptyState icon="..." title="..." description="..." action={<Button>} />` |
| error | `show(e.message, 'error')` через `useToast()` |
| default | нормальный UI |

## 7. Модалки и оверлеи

- Единственный способ делать оверлеи: `<Modal onClose={...}>` (bottom sheet)
- Не создавать кастомные position:fixed оверлеи
- Подтверждение деструктивного действия: `confirm()` (стандартный браузерный)

## 8. API-вызовы

- Все через `api.*` из `frontend/src/api/index.js`
- Новый метод — добавить туда, не вызывать fetch/axios напрямую в компонентах
- Паттерн в компоненте:
```js
const [loading, setLoading] = useState(false)
async function handleAction() {
  setLoading(true)
  try {
    const result = await api.someMethod(...)
    // обновить стейт
  } catch (e) {
    show(e.message, 'error')
  } finally {
    setLoading(false)
  }
}
```

## 9. Запрещено

- Дубли компонентов
- Разные версии одного UI-элемента
- Inline styles (color, background, boxShadow, fontSize)
- Создание компонентов без проверки существующих
- Нарушение структуры папок
- Прямые fetch/axios в компонентах
- Новые CSS-переменные — только Tailwind-токены
