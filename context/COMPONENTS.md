# MealBot — Карта компонентов

_Актуально на апрель 2026_

---

## Общие UI-компоненты

| Компонент | Описание |
|---|---|
| `Button` | primary / secondary / ghost / icon, размеры sm/md/lg |
| `TextInput` | с иконкой слева, состояния error / disabled |
| `Textarea` | resize, placeholder |
| `SearchInput` | TextInput с иконкой 🔍, специализированный |
| `Chip` | фильтры, теги, mealTime — active/inactive |
| `Toggle` | переключатель on/off (холодильник, настройки) |
| `Tabs` | вкладки (Моя кухня / Готовые / Избранное) |
| `Card` | обёртка с border + bg |
| `Modal` | оверлей + bottom sheet |
| `TopBar` | заголовок + левая/правая зоны кнопок |
| `BottomTabBar` | Home / Recipes / Fridge / Plan |
| `EmptyState` | иконка + заголовок + текст + CTA |
| `Loader` | спиннер, inline и full-page варианты |
| `Toast` | success / error уведомления |
| `Avatar` | аватар пользователя / группы |
| `SectionTitle` | заголовок раздела (uppercase, letter-spacing) |

---

## Home

| Компонент | Описание |
|---|---|
| `GroupHeader` | шапка с приветствием и аватаром |
| `HomeTitle` | "Доброе утро! 👋" + подзаголовок |
| `MealTimeChips` | Завтрак / Обед / Ужин / Перекус |
| `QuickFilters` | быстрые фильтры (теги, кухня) |
| `FridgeModeToggle` | переключатель 🧊 режима холодильника |
| `RecipeList` | список / сетка карточек |
| `RecipeCard` | карточка блюда |
| `FavoritesBlock` | блок избранных (опционально) |
| `HomeEmptyState` | пустая кухня — 2 CTA кнопки |

---

## Recipes

| Компонент | Описание |
|---|---|
| `RecipesHeader` | заголовок страницы + кнопка добавить |
| `SearchInput` | поиск по названию / ингредиентам |
| `FilterChips` | Все / Избранное + категории |
| `MealTypeChips` | фильтр по приёму пищи |
| `RecipeList` | общий с Home |
| `RecipeCard` | общий с Home |
| `AddRecipeButton` | FAB или кнопка в TopBar |
| `RecipesEmptyState` | пусто по фильтру / пустая кухня |

---

## Recipe Details

| Компонент | Описание |
|---|---|
| `RecipeHeader` | фото / заглушка + кнопки действий |
| `RecipeMeta` | категория, кухня, ⏱ время, 🔥 ккал, сложность |
| `IngredientList` | список ингредиентов с количеством |
| `RecipeSteps` | пошаговый рецепт (markdown) |
| `CommentsSection` | блок комментариев |
| `CommentList` | список комментариев (закреплённые сверху) |
| `CommentForm` | textarea + кнопка отправить |
| `AddToPlanButton` | 📅 Буду готовить |
| `EditRecipeButton` | редактировать / удалить (только автор) |

---

## Add Recipe

| Компонент | Описание |
|---|---|
| `AddRecipeHeader` | TopBar + кнопка Сохранить |
| `FormModeToggle` | ⚡ Быстро / 📋 Расширенно |
| `RecipeForm` | контейнер формы |

**Быстрый режим:**

| Компонент | Описание |
|---|---|
| `RecipeNameInput` | название блюда * |
| `MealTypeChips` | время приёма пищи |
| `IngredientInput` | поиск и добавление ингредиентов |
| `IngredientListEditor` | список добавленных с кол-вом + удалить |

**Расширенный режим (дополнительно):**

| Компонент | Описание |
|---|---|
| `RecipeDescriptionInput` | краткое описание |
| `DishTypeChips` | категории блюда |
| `TimeInput` | время приготовления (мин) |
| `DifficultySelect` | сложность easy/medium/hard |
| `RecipeStepsEditor` | textarea для шагов приготовления |
| `ImageUploader` | до 10 фото, смена главного |
| `VideoUploader` | загрузка видео |
| `TagsInput` | теги через запятую |
| `CuisineSelect` | кухня с автодополнением |
| `GroupSelect` | привязка к группе |
| `VisibilitySelect` | PRIVATE / FAMILY / PUBLIC / ALL_GROUPS |
| `SubmitButton` | сохранить / создать |

---

## Fridge

| Компонент | Описание |
|---|---|
| `FridgeHeader` | "Семейный холодильник" / "Холодильник" + счётчик |
| `TelegramBanner` | баннер подключения бота (если не подключён) |
| `FridgeItemList` | список продуктов по категориям |
| `FridgeItemRow` | строка: emoji + название + кол-во + удалить |
| `AddFridgeItemButton` | кнопка + Добавить |
| `AddFridgeItemModal` | модал: поиск + чипы по категориям |
| `FridgeSuggestions` | "✨ Что приготовить?" |
| `RecipeCard` | общий, используется в рекомендациях |
| `FridgeEmptyState` | пустой холодильник + CTA |
| `GuestFridgeBlock` | заглушка для неавторизованных |

---

## Plan

| Компонент | Описание |
|---|---|
| `PlanHeader` | заголовок страницы |
| `PlanDaySection` | группа блюд за один день с датой |
| `MealTypeSection` | подгруппа: Завтрак / Обед / Ужин... |
| `PlannedMealsList` | список записей плана |
| `PlannedMealCard` | фото + название + автор + удалить |
| `AddToPlanModal` | модал добавления из Recipe Details |
| `RemoveFromPlanButton` | кнопка ✕ (только своя запись) |
| `PlanEmptyState` | список пуст + CTA "Выбрать блюда" |

---

## Profile / User modal

| Компонент | Описание |
|---|---|
| `UserModal` | модальное окно профиля |
| `UserInfo` | имя, email, аватар |
| `GroupsSection` | список групп пользователя |
| `GroupList` | FAMILY группа + обычные |
| `CreateGroupButton` | создать группу |
| `TelegramBotStatus` | статус подключения бота |
| `SettingsLink` | переход в настройки |
| `LogoutButton` | выйти |

---

## Settings

| Компонент | Описание |
|---|---|
| `SettingsHeader` | заголовок |
| `ProfileSettings` | имя, email, телефон, Telegram |
| `NotificationSettings` | управление Telegram-уведомлениями |
| `HelpSection` | FAQ / поддержка |
| `AboutSection` | версия, ссылки |

---

## Шаблоны (онбординг / Add Recipe)

| Компонент | Описание |
|---|---|
| `TemplateList` | список готовых рецептов для копирования |
| `TemplateCard` | карточка шаблона |
| `AddTemplateButton` | скопировать в мою кухню |
