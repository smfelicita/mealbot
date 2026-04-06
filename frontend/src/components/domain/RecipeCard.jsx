import { forwardRef } from 'react'

const CAT_EMOJI = {
  BREAKFAST: '🍳', LUNCH: '🍱', DINNER: '🌙',
  SOUP: '🍲', SALAD: '🥗', DESSERT: '🍰',
  SNACK: '🥨', DRINK: '🥤',
}

const CAT_RU = {
  BREAKFAST: 'Завтрак', LUNCH: 'Обед', DINNER: 'Ужин',
  SOUP: 'Суп', SALAD: 'Салат', DESSERT: 'Десерт',
  SNACK: 'Перекус', DRINK: 'Напиток',
}

const VISIBILITY_BADGE = {
  PRIVATE:    { icon: '🔒' },
  FAMILY:     { icon: '👨‍👩‍👧' },
  ALL_GROUPS: { icon: '👥' },
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

// ─── Horizontal row card (Home screen) ───────────────────────────────────────
const RowCard = forwardRef(function RowCard({ dish, onClick, isFav, onToggleFav }, ref) {
  const img   = dish.images?.[0] || dish.imageUrl
  const cat   = dish.categories?.[0] ?? dish.category
  const emoji = CAT_EMOJI[cat] || '🍽️'

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-between bg-white rounded-2xl p-4 text-left
        active:scale-[0.98] transition-transform shrink-0"
      style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}
    >
      {/* Left */}
      <div className="flex-1 min-w-0 pr-3">
        <p className="font-semibold text-[15px] leading-snug truncate" style={{ color: '#1a1a1a' }}>
          {dish.name}
        </p>
        <div className="flex items-center gap-1.5 mt-1 text-[13px]" style={{ color: '#9e9e9e' }}>
          {dish.cookTime && <span>{dish.cookTime} мин</span>}
          {dish.cookTime && dish.categories?.[0] && <span>·</span>}
          {dish.categories?.[0] && <span>{CAT_RU[cat] || cat}</span>}
        </div>
      </div>

      {/* Right: image */}
      {img ? (
        <img
          src={img}
          alt={dish.name}
          className="w-16 h-16 rounded-xl object-cover shrink-0"
        />
      ) : (
        <div className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl shrink-0"
          style={{ background: '#F5EFE6' }}>
          {emoji}
        </div>
      )}
    </button>
  )
})

// ─── Vertical grid card (Dishes / Search) ────────────────────────────────────
function GridCard({ dish, onClick, searchQuery, isFav, onToggleFav, fridgeIngredientIds }) {
  const img   = dish.images?.[0] || dish.imageUrl
  const cat   = dish.categories?.[0] ?? dish.category
  const emoji = CAT_EMOJI[cat] || '🍽️'
  const visBadge = dish.visibility && dish.visibility !== 'PUBLIC'
    ? VISIBILITY_BADGE[dish.visibility]
    : null

  const allInFridge = fridgeIngredientIds
    && dish.ingredients?.length > 0
    && dish.ingredients.every(i => i.toTaste || i.isBasic || fridgeIngredientIds.has(i.id))

  let matchHint = null
  if (searchQuery) {
    const q = searchQuery.toLowerCase()
    if (!dish.name?.toLowerCase().includes(q) && !dish.description?.toLowerCase().includes(q)) {
      const matchedIng = dish.ingredients?.find(i => i.name?.toLowerCase().includes(q))
      const matchedTag = dish.tags?.find(t => t.toLowerCase().includes(q))
      if (matchedIng)      matchHint = `по ингредиенту: ${matchedIng.name}`
      else if (matchedTag) matchHint = `по тегу: ${matchedTag}`
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full bg-white shadow-sm rounded-2xl overflow-hidden text-left
        active:scale-[0.98] transition-transform"
    >
      {/* Image */}
      {img ? (
        <div className="relative h-[130px] overflow-hidden">
          <img src={img} alt={dish.name} className="w-full h-full object-cover" />
          <div className="absolute top-2 right-2 bg-black/50 rounded-lg px-1.5 py-0.5 text-[13px]">
            {emoji}
          </div>
          {onToggleFav && (
            <button type="button"
              onClick={e => { e.stopPropagation(); onToggleFav(dish.id) }}
              className="absolute top-2 left-2 w-8 h-8 flex items-center justify-center
                bg-black/50 rounded-lg text-[15px] focus:outline-none">
              {isFav ? '❤️' : '🤍'}
            </button>
          )}
          {allInFridge && (
            <div className="absolute bottom-2 left-2 bg-sage/90 text-white text-[11px] font-bold px-2 py-0.5 rounded-lg">
              ✓ всё есть
            </div>
          )}
        </div>
      ) : (
        <div className="relative h-[52px] bg-bg-3 flex items-center justify-center text-2xl">
          {emoji}
          {onToggleFav && (
            <button type="button"
              onClick={e => { e.stopPropagation(); onToggleFav(dish.id) }}
              className="absolute top-1.5 left-2 text-[15px] focus:outline-none">
              {isFav ? '❤️' : '🤍'}
            </button>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-3 pb-3.5">
        <div className="flex items-start gap-1.5 mb-1">
          <p className="font-bold text-[15px] leading-tight flex-1">
            <Highlight text={dish.name} query={searchQuery} />
          </p>
          {visBadge && <span className="text-sm shrink-0 mt-0.5">{visBadge.icon}</span>}
        </div>

        {dish.description && (
          <p className="text-text-2 text-[13px] mb-2 truncate">
            <Highlight text={dish.description} query={searchQuery} />
          </p>
        )}

        {matchHint && (
          <p className="text-[12px] text-accent font-semibold mb-1.5">🔍 {matchHint}</p>
        )}

        <div className="flex flex-wrap gap-2">
          {dish.cookTime && (
            <span className="text-[12px] text-text-2">⏱️ {dish.cookTime} мин</span>
          )}
          {dish.calories && (
            <span className="text-[12px] text-text-2">🔥 {dish.calories} ккал</span>
          )}
        </div>
      </div>
    </button>
  )
}

// ─── Export ───────────────────────────────────────────────────────────────────
const RecipeCard = forwardRef(function RecipeCard({ variant = 'grid', ...props }, ref) {
  if (variant === 'row') return <RowCard ref={ref} {...props} />
  return <GridCard {...props} />
})
export default RecipeCard
