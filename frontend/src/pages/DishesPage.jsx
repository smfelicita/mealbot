import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { useStore } from '../store'
import { SearchInput, Tabs, Button, Toggle } from '../components/ui'
import { MealTypeChips, RecipeList, FilterPanel } from '../components/domain'

const VIEW_TABS = [
  { value: 'my',      label: 'Моя кухня',      icon: '🏠' },
  { value: 'catalog', label: 'Готовые рецепты', icon: '📚' },
  { value: 'favorites', label: 'Избранное',     icon: '❤️' },
]

export default function DishesPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { fridgeMode, toggleFridgeMode, token } = useStore()

  const [dishes, setDishes]         = useState([])
  const [loading, setLoading]       = useState(true)
  const [q, setQ]                   = useState('')
  const [mealTime, setMealTime]     = useState('')
  const [category, setCategory]     = useState('')
  const [activeTags, setActiveTags] = useState([])
  const [showFilters, setShowFilters] = useState(false)
  const [favIds, setFavIds]           = useState(new Set())
  const [fridgeIngredientIds, setFridgeIngredientIds] = useState(new Set())

  const [view, setView] = useState(() => {
    if (searchParams.get('view') === 'catalog') return 'catalog'
    return token ? 'my' : 'catalog'
  })

  // Загружаем избранное и холодильник один раз
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
        q:         q || undefined,
        category:  category || undefined,
        mealTime:  mealTime || undefined,
        tags:      activeTags.length ? activeTags.join(',') : undefined,
        fridgeMode: fridgeMode ? 'true' : undefined,
        myKitchen: (view === 'my' && token) ? 'true' : undefined,
        favorites:  (view === 'favorites' && token) ? 'true' : undefined,
      })
      setDishes(data)
    } catch {
      setDishes([])
    } finally {
      setLoading(false)
    }
  }, [q, category, mealTime, activeTags, fridgeMode, view, token])

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
    setCategory('')
    setActiveTags([])
  }

  const hasFilters   = Boolean(category || activeTags.length)
  const filterCount  = (category ? 1 : 0) + activeTags.length
  const visibleTabs  = token ? VIEW_TABS : VIEW_TABS.filter(t => t.value === 'catalog')

  // Пустые состояния
  function emptyProps() {
    if (view === 'my' && !q && !hasFilters) {
      return {
        icon: '🍽️',
        title: 'Ваша кухня пока пуста',
        description: 'Добавьте свои блюда или скопируйте из готовых рецептов',
        action: (
          <div className="flex gap-2.5 flex-wrap justify-center">
            <Button onClick={() => navigate('/my-recipes/new')}>+ Добавить рецепт</Button>
            <Button variant="secondary" onClick={() => setView('catalog')}>Готовые рецепты →</Button>
          </div>
        ),
      }
    }
    if (view === 'favorites' && !q && !hasFilters) {
      return {
        icon: '🤍',
        title: 'Избранное пусто',
        description: 'Нажмите ❤️ на странице любого рецепта',
      }
    }
    return {
      icon: '🔍',
      title: 'Ничего не найдено',
      description: 'Попробуйте изменить фильтры или поисковый запрос',
    }
  }

  return (
    <div className="max-w-app w-full mx-auto px-4 py-3 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h1 className="font-serif text-xl font-bold text-accent">Рецепты</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowFilters(s => !s)}
            className={[
              'flex items-center gap-1 px-2.5 py-1.5 rounded-sm border text-xs font-bold transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-accent/30',
              showFilters || hasFilters
                ? 'border-accent text-accent bg-accent/5'
                : 'border-border text-text-2 bg-bg-3',
            ].join(' ')}
          >
            🎛 {filterCount > 0 ? `(${filterCount})` : 'Фильтры'}
          </button>
          <Toggle checked={fridgeMode} onChange={toggleFridgeMode} label="🧊" />
        </div>
      </div>

      {/* Вкладки (только для залогиненных) */}
      {token && (
        <div className="mb-3">
          <Tabs tabs={visibleTabs} active={view} onChange={setView} />
        </div>
      )}

      {/* Поиск */}
      <SearchInput
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Поиск рецептов..."
        className="mb-3"
      />

      {/* Фильтры */}
      {showFilters && (
        <FilterPanel
          category={category}
          onCategory={setCategory}
          activeTags={activeTags}
          onTags={setActiveTags}
          onReset={resetFilters}
        />
      )}

      {/* Фильтр по приёму пищи */}
      <div className="mb-4">
        <MealTypeChips active={mealTime} onChange={setMealTime} />
      </div>

      {/* Баннер режима холодильника */}
      {fridgeMode && (
        <div className="flex items-center gap-2 bg-teal/8 border border-teal/20 rounded-sm px-3.5 py-2.5 mb-4 text-sm text-teal">
          🧊 Режим холодильника — только блюда из ваших продуктов
        </div>
      )}

      {/* Счётчик */}
      {!loading && (
        <p className="text-xs text-text-2 mb-3">
          Найдено: {dishes.length}
        </p>
      )}

      {/* Список */}
      <RecipeList
        dishes={dishes}
        loading={loading}
        searchQuery={q || undefined}
        isFavSet={favIds}
        onToggleFav={token ? handleToggleFav : undefined}
        fridgeIngredientIds={fridgeIngredientIds}
        onDishClick={id => navigate(`/dishes/${id}`)}
        {...emptyProps()}
      />

      {/* FAB добавить рецепт */}
      {token && (
        <button
          type="button"
          onClick={() => navigate('/my-recipes/new')}
          className="fixed bottom-[68px] right-4 w-12 h-12 bg-accent text-white text-2xl
            rounded-full shadow-card flex items-center justify-center z-40
            hover:bg-accent-2 active:scale-95 transition-all
            focus:outline-none focus:ring-2 focus:ring-accent/50"
          aria-label="Добавить рецепт"
        >
          +
        </button>
      )}
    </div>
  )
}
