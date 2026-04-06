import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useStore } from '../store'
import { SearchInput } from '../components/ui'
import { MealTypeChips, RecipeList } from '../components/domain'

// ─── FilterChips (Все / Избранное) ────────────────────────────────────────────
function FilterChips({ active, onChange }) {
  const options = [
    { value: 'all',       label: 'Все'       },
    { value: 'favorites', label: 'Избранное' },
  ]
  return (
    <div className="flex gap-2">
      {options.map(o => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={[
            'px-4 py-1.5 rounded-full text-[13px] font-medium transition-all focus:outline-none',
            active === o.value ? 'text-white' : 'bg-white text-text-2',
          ].join(' ')}
          style={active === o.value
            ? { background: '#C4704A', boxShadow: '0 1px 6px rgba(196,112,74,0.3)' }
            : { boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }
          }
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

// ─── RecipesEmptyState ────────────────────────────────────────────────────────
function RecipesEmptyState({ filter, mealTime, q, onAddRecipe, onReset }) {
  const hasActiveFilters = filter !== 'all' || mealTime || q

  if (!hasActiveFilters) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center"
          style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C4704A" strokeWidth="1.6" strokeLinecap="round">
            <path d="M12 2C8 2 4 6 4 10c0 5.25 8 12 8 12s8-6.75 8-12c0-4-4-8-8-8z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
        <p className="font-semibold text-[16px] text-text">Ваша кухня пока пуста</p>
        <p className="text-[13px] text-text-2">Добавьте первое блюдо — личное или для всей семьи</p>
        <button
          type="button"
          onClick={onAddRecipe}
          className="mt-1 px-5 py-2.5 rounded-full text-[14px] font-semibold text-white"
          style={{ background: '#C4704A' }}
        >
          Добавить блюдо
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3 py-10 px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center"
        style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9e9e9e" strokeWidth="1.8" strokeLinecap="round">
          <circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/>
        </svg>
      </div>
      <p className="font-semibold text-[15px] text-text">Ничего не найдено</p>
      <p className="text-[13px] text-text-2">Попробуйте изменить фильтры или поисковый запрос</p>
      <button
        type="button"
        onClick={onReset}
        className="mt-1 px-5 py-2 rounded-full text-[13px] font-semibold bg-white"
        style={{ color: '#C4704A', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}
      >
        Сбросить фильтры
      </button>
    </div>
  )
}

// ─── AddRecipeButton (FAB) ────────────────────────────────────────────────────
function AddRecipeButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-[76px] right-4 w-13 h-13 flex items-center justify-center rounded-full text-white z-40
        active:scale-95 transition-transform focus:outline-none"
      style={{ background: '#C4704A', boxShadow: '0 4px 16px rgba(196,112,74,0.35)', width: 52, height: 52 }}
      aria-label="Добавить блюдо"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
        <path d="M12 5v14M5 12h14"/>
      </svg>
    </button>
  )
}

// ─── RecipesHeader ────────────────────────────────────────────────────────────
function RecipesHeader({ fridgeMode, onToggleFridge }) {
  return (
    <div className="flex items-center justify-between px-4 pt-5 pb-2">
      <h1 className="font-semibold text-[22px]" style={{ color: '#1a1a1a' }}>Мои блюда</h1>
      <button
        type="button"
        onClick={onToggleFridge}
        className={[
          'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium transition-all',
          fridgeMode ? 'text-white' : 'bg-white text-text-2',
        ].join(' ')}
        style={fridgeMode
          ? { background: '#5C7A59', boxShadow: '0 1px 6px rgba(92,122,89,0.3)' }
          : { boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }
        }
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <rect x="6" y="3" width="12" height="18" rx="2"/><line x1="6" y1="10" x2="18" y2="10"/>
          <circle cx="10" cy="7" r="1.2" fill="currentColor" stroke="none"/>
          <circle cx="10" cy="15" r="1.2" fill="currentColor" stroke="none"/>
        </svg>
        Холодильник
      </button>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DishesPage() {
  const navigate = useNavigate()
  const { fridgeMode, toggleFridgeMode, token } = useStore()

  const [dishes, setDishes]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [q, setQ]                 = useState('')
  const [mealTime, setMealTime]   = useState('')
  const [filter, setFilter]       = useState('all')   // 'all' | 'favorites'
  const [favIds, setFavIds]       = useState(new Set())
  const [fridgeIngredientIds, setFridgeIngredientIds] = useState(new Set())

  useEffect(() => {
    if (!token) return
    api.getFavoriteIds().then(({ dishIds }) => setFavIds(new Set(dishIds))).catch(() => {})
    api.getFridge().then(({ items }) =>
      setFridgeIngredientIds(new Set(items.map(i => i.ingredientId)))
    ).catch(() => {})
  }, [token])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.getDishes({
        q:          q || undefined,
        mealTime:   mealTime || undefined,
        fridgeMode: fridgeMode ? 'true' : undefined,
        myKitchen:  token ? 'true' : undefined,
        favorites:  (filter === 'favorites' && token) ? 'true' : undefined,
      })
      setDishes(data.dishes ?? data)
    } catch {
      setDishes([])
    } finally {
      setLoading(false)
    }
  }, [q, mealTime, fridgeMode, filter, token])

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [load])

  function handleToggleFav(dishId) {
    const isFav = favIds.has(dishId)
    setFavIds(prev => {
      const next = new Set(prev)
      isFav ? next.delete(dishId) : next.add(dishId)
      return next
    })
    isFav ? api.removeFavorite(dishId).catch(() => {}) : api.addFavorite(dishId).catch(() => {})
  }

  function resetFilters() {
    setQ('')
    setMealTime('')
    setFilter('all')
  }

  return (
    <div className="flex flex-col pb-24" style={{ background: '#F5F3EF', minHeight: '100%' }}>

      {/* RecipesHeader */}
      <RecipesHeader fridgeMode={fridgeMode} onToggleFridge={toggleFridgeMode} />

      {/* SearchInput */}
      <div className="px-4 mt-3">
        <SearchInput
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Поиск блюд..."
        />
      </div>

      {/* FilterChips + MealTypeChips */}
      <div className="flex flex-col gap-3 px-4 mt-4">
        {token && (
          <FilterChips active={filter} onChange={v => { setFilter(v); setMealTime('') }} />
        )}
        <MealTypeChips active={mealTime} onChange={setMealTime} />
      </div>

      {/* RecipeList */}
      <div className="px-4 mt-4">
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="w-full h-[76px] bg-white rounded-2xl animate-pulse"
                style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }} />
            ))}
          </div>
        ) : dishes.length === 0 ? (
          <RecipesEmptyState
            filter={filter}
            mealTime={mealTime}
            q={q}
            onAddRecipe={() => navigate('/my-recipes/new')}
            onReset={resetFilters}
          />
        ) : (
          <RecipeList
            dishes={dishes}
            loading={false}
            searchQuery={q || undefined}
            isFavSet={favIds}
            onToggleFav={token ? handleToggleFav : undefined}
            fridgeIngredientIds={fridgeIngredientIds}
            onDishClick={id => navigate(`/dishes/${id}`)}
          />
        )}
      </div>

      {/* AddRecipeButton (FAB) */}
      {token && <AddRecipeButton onClick={() => navigate('/my-recipes/new')} />}
    </div>
  )
}
