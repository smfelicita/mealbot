import { forwardRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CAT_EMOJI, CAT_RU } from './dishCategories'

const VISIBILITY_BADGE = {
  PRIVATE:    { icon: '🔒' },
  FAMILY:     { icon: '👨‍👩‍👧' },
  ALL_GROUPS: { icon: '👥' },
}

const VISIBILITY_LABEL = {
  PRIVATE:    { icon: '🔒', label: 'Личный' },
  FAMILY:     { icon: '👨‍👩‍👧', label: 'Семья' },
  ALL_GROUPS: { icon: '👥', label: 'Группы' },
}

const SUPABASE_IMG = 'https://nwtqeytmmqmkwqafkgin.supabase.co/storage/v1/object/public/media/images'

function getDishMeta(dish) {
  const cat      = dish.categories?.[0] ?? dish.category
  const emoji    = CAT_EMOJI[cat] || '🍽️'
  const uploaded = dish.images?.[0] || dish.imageUrl
  const img      = uploaded || (cat ? `${SUPABASE_IMG}/${cat.toLowerCase()}.jpg` : null)
  return { img, cat, emoji }
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

// ─── Horizontal row card (Home screen / Dishes list) ─────────────────────────
const RowCard = forwardRef(function RowCard({ dish, onClick, isFav, onToggleFav, fridgeIngredientIds, onAddToPlan, hint }, ref) {
  const { img, cat, emoji } = getDishMeta(dish)
  const navigate = useNavigate()
  const [addedToPlan, setAddedToPlan] = useState(false)

  const visInfo = dish.visibility && dish.visibility !== 'PUBLIC'
    ? VISIBILITY_LABEL[dish.visibility]
    : null

  const missing = fridgeIngredientIds && dish.ingredients?.length > 0
    ? dish.ingredients.filter(i => !i.toTaste && !i.isBasic && !fridgeIngredientIds.has(i.id))
    : null
  const allInFridge = missing !== null && missing.length === 0

  return (
    <div className="flex flex-col">
      <div
        ref={ref}
        className="w-full flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm active:scale-[0.98] transition-transform"
      >
        {/* Top: photo + content */}
        <div className="flex relative">
          {/* Photo — 38%, only if image exists */}
          {img && (
            <button type="button" onClick={onClick} className="w-[38%] shrink-0 focus:outline-none">
              <img src={img} alt={dish.name} className="w-full h-full object-cover min-h-[120px]" />
            </button>
          )}

          {/* Content */}
          <button type="button" onClick={onClick} className="flex-1 min-w-0 px-3 py-3 flex flex-col gap-1 text-left focus:outline-none">
            <p className="font-bold text-[15px] leading-snug text-text pr-6">{dish.name}</p>

            {(cat || dish.cookTime) && (
              <div className="flex items-center gap-1 text-[13px] text-text-2">
                {cat && <span>{CAT_EMOJI[cat]} {CAT_RU[cat] || cat}</span>}
                {cat && dish.cookTime && <span>·</span>}
                {dish.cookTime && <span>⏱ {dish.cookTime} мин</span>}
              </div>
            )}

            {visInfo && (
              <div className="flex items-center gap-1 text-[12px] text-text-3">
                <span>{visInfo.icon}</span>
                <span>{visInfo.label}</span>
              </div>
            )}

            {missing !== null && (
              <div className="flex flex-col gap-0.5 text-[12px]">
                {allInFridge ? (
                  <span className="text-sage font-semibold">🧊 Всё есть в холодильнике</span>
                ) : (
                  <>
                    <span className="text-text-3 font-medium">🧊 Надо докупить:</span>
                    <span className="text-text-3">
                      {missing.slice(0, 2).map(i => i.name).join(', ')}
                      {missing.length > 2 && ` и ещё ${missing.length - 2}`}
                    </span>
                  </>
                )}
              </div>
            )}
            {onAddToPlan && (
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation()
                  if (addedToPlan) { navigate('/plan'); return }
                  onAddToPlan(dish)
                  setAddedToPlan(true)
                }}
                className={[
                  'mt-auto pt-2 w-full py-1.5 rounded-xl text-[13px] font-medium border transition-all focus:outline-none',
                  addedToPlan
                    ? 'bg-sage/10 border-sage/40 text-sage'
                    : 'bg-white border-border/60 text-text-2',
                ].join(' ')}
              >
                {addedToPlan ? '✓ В плане — перейти' : 'Буду готовить'}
              </button>
            )}
          </button>

          {/* Heart — top-right corner */}
          {onToggleFav && (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onToggleFav(dish.id) }}
              className="absolute top-2.5 right-2.5 w-7 h-7 flex items-center justify-center focus:outline-none"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={isFav ? 'text-red-500' : 'text-text-3'}>
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </button>
          )}
        </div>

      </div>

      {hint && (
        <p className="text-xs px-1 pt-1.5 text-text-3">{hint}</p>
      )}
    </div>
  )
})

// ─── Vertical grid card (Search / Group detail) ───────────────────────────────
function GridCard({ dish, onClick, searchQuery, isFav, onToggleFav, fridgeIngredientIds }) {
  const { img, cat, emoji } = getDishMeta(dish)
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
            <div className="absolute bottom-2 left-2 bg-sage/90 text-white text-2xs font-bold px-2 py-0.5 rounded-lg">
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
          <p className="text-xs text-accent font-semibold mb-1.5">🔍 {matchHint}</p>
        )}

        <div className="flex flex-wrap gap-2">
          {dish.cookTime && (
            <span className="text-xs text-text-2">⏱️ {dish.cookTime} мин</span>
          )}
          {dish.calories && (
            <span className="text-xs text-text-2">🔥 {dish.calories} ккал</span>
          )}
        </div>
      </div>

    </button>
  )
}

// ─── Compact inline card (AI chat) ───────────────────────────────────────────
function InlineCard({ dish, onClick }) {
  const { img, emoji } = getDishMeta(dish)
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 bg-bg-3 border border-border rounded-xl px-2.5 py-2 w-full text-left hover:border-accent/50 transition-colors"
    >
      <div className="w-8 h-8 rounded-lg overflow-hidden bg-bg-2 flex items-center justify-center text-base shrink-0">
        {img
          ? <img src={img} alt="" className="w-full h-full object-cover" />
          : emoji}
      </div>
      <span className="flex-1 text-[13px] font-semibold truncate text-text">{dish.nameRu || dish.name}</span>
      <span className="text-text-3 text-xs shrink-0">→</span>
    </button>
  )
}

// ─── Export ───────────────────────────────────────────────────────────────────
const DishCard = forwardRef(function DishCard({ variant = 'grid', ...props }, ref) {
  if (variant === 'row')    return <RowCard ref={ref} {...props} />
  if (variant === 'inline') return <InlineCard {...props} />
  return <GridCard {...props} />
})
export default DishCard
