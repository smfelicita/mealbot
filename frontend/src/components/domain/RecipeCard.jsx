import Card from '../ui/Card'

const CAT_EMOJI = {
  BREAKFAST: '🍳', LUNCH: '🍱', DINNER: '🌙',
  SOUP: '🍲', SALAD: '🥗', DESSERT: '🍰',
  SNACK: '🥨', DRINK: '🥤',
}

const VISIBILITY_BADGE = {
  PRIVATE:    { icon: '🔒', label: 'Личный'  },
  FAMILY:     { icon: '👨‍👩‍👧', label: 'Семья'  },
  ALL_GROUPS: { icon: '👥', label: 'Группы'  },
}

const DIFFICULTY = {
  easy:   { label: 'Просто',  className: 'text-teal'   },
  medium: { label: 'Средне',  className: 'text-accent-2' },
  hard:   { label: 'Сложно',  className: 'text-red-400' },
}

function Highlight({ text, query }) {
  if (!query || !text) return text
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-accent/25 text-inherit rounded-[2px] px-px">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  )
}

export default function RecipeCard({
  dish,
  onClick,
  searchQuery,
  isFav,
  onToggleFav,
  fridgeIngredientIds,
}) {
  const primaryCategory = dish.categories?.[0] ?? dish.category
  const categoryEmoji   = CAT_EMOJI[primaryCategory] || '🍽️'
  const visibilityBadge = dish.visibility && dish.visibility !== 'PUBLIC'
    ? VISIBILITY_BADGE[dish.visibility]
    : null

  // Индикатор холодильника
  const allInFridge = fridgeIngredientIds
    && dish.ingredients?.length > 0
    && dish.ingredients.every(i => i.toTaste || i.isBasic || fridgeIngredientIds.has(i.id))

  // Подсказка совпадения поиска
  let matchHint = null
  if (searchQuery) {
    const q = searchQuery.toLowerCase()
    const nameMatches = dish.name?.toLowerCase().includes(q)
    const descMatches = dish.description?.toLowerCase().includes(q)
    if (!nameMatches && !descMatches) {
      const matchedIng = dish.ingredients?.find(i => i.name?.toLowerCase().includes(q))
      const matchedTag = dish.tags?.find(t => t.toLowerCase().includes(q))
      if (matchedIng)      matchHint = `по ингредиенту: ${matchedIng.name}`
      else if (matchedTag) matchHint = `по тегу: ${matchedTag}`
    }
  }

  return (
    <Card onClick={onClick}>
      {/* Фото */}
      {dish.imageUrl ? (
        <div className="relative h-[130px] overflow-hidden">
          <img
            src={dish.imageUrl}
            alt={dish.name}
            className="w-full h-full object-cover"
          />
          {/* Категория */}
          <div className="absolute top-2 right-2 bg-black/55 rounded-lg px-2 py-0.5 text-[13px] font-bold">
            {categoryEmoji}
          </div>
          {/* Кнопка избранного */}
          {onToggleFav && (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onToggleFav(dish.id) }}
              className="absolute top-2 left-2 w-8 h-8 flex items-center justify-center
                bg-black/55 rounded-lg border-none cursor-pointer text-[15px]
                focus:outline-none focus:ring-2 focus:ring-accent/50"
              aria-label={isFav ? 'Убрать из избранного' : 'В избранное'}
            >
              {isFav ? '❤️' : '🤍'}
            </button>
          )}
          {/* Индикатор холодильника */}
          {allInFridge && (
            <div className="absolute bottom-2 left-2 bg-teal/85 text-white text-[11px] font-bold px-2 py-0.5 rounded-[6px]">
              ✓ всё есть
            </div>
          )}
        </div>
      ) : (
        <div className="relative h-[52px] bg-bg-3 flex items-center justify-center text-2xl">
          {categoryEmoji}
          {onToggleFav && (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onToggleFav(dish.id) }}
              className="absolute top-1.5 left-2 text-[15px] bg-transparent border-none
                cursor-pointer leading-none focus:outline-none"
              aria-label={isFav ? 'Убрать из избранного' : 'В избранное'}
            >
              {isFav ? '❤️' : '🤍'}
            </button>
          )}
        </div>
      )}

      {/* Контент */}
      <div className="p-3 pb-3.5">
        {/* Название + бейдж видимости */}
        <div className="flex items-start gap-1.5 mb-1">
          <p className="font-extrabold text-[1.05rem] leading-tight flex-1">
            <Highlight text={dish.name} query={searchQuery} />
          </p>
          {visibilityBadge && (
            <span className="text-sm shrink-0 mt-0.5" title={visibilityBadge.label}>
              {visibilityBadge.icon}
            </span>
          )}
        </div>

        {/* Описание */}
        {dish.description && (
          <p className="text-text-2 text-[0.85rem] mb-2 truncate">
            <Highlight text={dish.description} query={searchQuery} />
          </p>
        )}

        {/* Подсказка поиска */}
        {matchHint && (
          <p className="text-[0.75rem] text-accent font-semibold mb-1.5">
            🔍 {matchHint}
          </p>
        )}

        {/* Мета */}
        <div className="flex flex-wrap gap-2">
          {dish.cookTime && (
            <span className="text-[0.8rem] text-text-2 flex items-center gap-1">
              ⏱️ {dish.cookTime} мин
            </span>
          )}
          {dish.calories && (
            <span className="text-[0.8rem] text-text-2 flex items-center gap-1">
              🔥 {dish.calories} ккал
            </span>
          )}
          {dish.difficulty && DIFFICULTY[dish.difficulty] && (
            <span className={`text-[0.8rem] font-semibold ${DIFFICULTY[dish.difficulty].className}`}>
              {DIFFICULTY[dish.difficulty].label}
            </span>
          )}
          {dish.cuisine && (
            <span className="text-[0.8rem] text-teal">{dish.cuisine}</span>
          )}
        </div>

        {/* Теги */}
        {dish.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {dish.tags.slice(0, 3).map(tag => (
              <span
                key={tag}
                className={[
                  'text-[0.72rem] px-2 py-0.5 rounded-full font-bold',
                  searchQuery && tag.toLowerCase().includes(searchQuery.toLowerCase())
                    ? 'bg-accent/20 text-accent'
                    : 'bg-bg-3 text-text-2',
                ].join(' ')}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}
