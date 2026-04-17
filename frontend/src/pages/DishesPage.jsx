import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useStore } from '../store'
import { SearchInput, useToast } from '../components/ui'
import { MealTypeChips, DishList, BulkAddModal } from '../components/domain'
import { useHintDismiss } from '../hooks/useHintDismiss'

// ─── QuickFilters ─────────────────────────────────────────────────────────────
function QuickFilters({ fridgeActive, favActive, filtersActive, onToggleFridge, onToggleFav, onOpenFilters }) {
  const chip = (active, label, onClick) => (
    <button
      type="button"
      onClick={onClick}
      className={[
        'px-4 py-1.5 rounded-full text-[13px] font-medium transition-all focus:outline-none shrink-0',
        active ? 'bg-sage text-white' : 'bg-white text-text-2 shadow-sm',
      ].join(' ')}
    >
      {label}
    </button>
  )
  return (
    <div className="flex items-center gap-2">
      {chip(fridgeActive, '🧊 Холодильник', onToggleFridge)}
      {chip(favActive,    '❤️ Избранное',   onToggleFav)}
      <div className="flex-1" />
      <button
        type="button"
        title="Сортировка"
        className="w-9 h-9 flex items-center justify-center rounded-full bg-white shadow-sm text-text-3"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M3 6h18M7 12h10M11 18h2"/>
        </svg>
      </button>
      <button
        type="button"
        title="Фильтры"
        onClick={onOpenFilters}
        className={[
          'w-9 h-9 flex items-center justify-center rounded-full shadow-sm relative',
          filtersActive ? 'bg-accent text-white' : 'bg-white text-text-3',
        ].join(' ')}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>
        </svg>
      </button>
    </div>
  )
}

// ─── RecipesEmptyState ────────────────────────────────────────────────────────
function RecipesEmptyState({ filter, mealTime, q, onAddRecipe, onReset, isGuest, onNavigate }) {
  const hasActiveFilters = filter !== 'all' || mealTime || q

  if (!hasActiveFilters && isGuest) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-sm text-accent">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <path d="M12 2C8 2 4 6 4 10c0 5.25 8 12 8 12s8-6.75 8-12c0-4-4-8-8-8z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
        <p className="font-semibold text-[16px] text-text">Добавь свои блюда</p>
        <p className="text-[13px] text-text-2">Зарегистрируйся — и MealBot каждый день будет подсказывать что приготовить</p>
        <button
          type="button"
          onClick={() => onNavigate('/auth?mode=register')}
          className="mt-1 px-5 py-2.5 rounded-full text-sm font-semibold text-white bg-accent"
        >
          Создать свою кухню
        </button>
        <button
          type="button"
          onClick={() => onNavigate('/auth')}
          className="text-[13px] text-text-3"
        >
          Уже есть аккаунт? Войти
        </button>
      </div>
    )
  }

  if (!hasActiveFilters) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-sm text-accent">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <path d="M12 2C8 2 4 6 4 10c0 5.25 8 12 8 12s8-6.75 8-12c0-4-4-8-8-8z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
        <p className="font-semibold text-[16px] text-text">Ваша кухня пока пуста</p>
        <p className="text-[13px] text-text-2">Добавьте первое блюдо — личное или для всей семьи</p>
        <button
          type="button"
          onClick={onAddRecipe}
          className="mt-1 px-5 py-2.5 rounded-full text-sm font-semibold text-white bg-accent"
        >
          Добавить блюдо
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3 py-10 px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-sm text-text-3">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/>
        </svg>
      </div>
      <p className="font-semibold text-[15px] text-text">Ничего не найдено</p>
      <p className="text-[13px] text-text-2">Попробуйте изменить фильтры или поисковый запрос</p>
      <button
        type="button"
        onClick={onReset}
        className="mt-1 px-5 py-2 rounded-full text-[13px] font-semibold bg-white text-accent shadow-sm"
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
        active:scale-95 transition-transform focus:outline-none bg-accent shadow-accent"
      aria-label="Добавить блюдо"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <path d="M12 5v14M5 12h14"/>
      </svg>
    </button>
  )
}



const LIMIT = 20

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DishesPage() {
  const navigate = useNavigate()
  const { token } = useStore()
  const { show, Toast } = useToast()

  const [dishes, setDishes]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore]     = useState(false)
  const [q, setQ]                 = useState('')
  const [mealTime, setMealTime]   = useState('')
  const [fridgeFilter, setFridgeFilter] = useState(false)
  const [favFilter, setFavFilter]       = useState(false)
  const [showFilters, setShowFilters]   = useState(false)
  const [favIds, setFavIds]       = useState(new Set())
  const [fridgeIngredientIds, setFridgeIngredientIds] = useState(new Set())
  const [showBulkAdd, setShowBulkAdd] = useState(false)
  const [bulkAddHintDismissed, dismissBulkAddHint] = useHintDismiss('mealbot_hint_bulkAdd_seen')
  const [firstDishSeen, markFirstDishSeen] = useHintDismiss('mealbot_hint_firstDish_seen')
  const [showFirstDishToast, setShowFirstDishToast] = useState(false)

  const offsetRef    = useRef(0)
  const sentinelRef  = useRef(null)
  const loadMoreFnRef = useRef(null)
  const canLoadRef   = useRef(false)

  useEffect(() => {
    if (!token) return
    api.getFavoriteIds().then(({ dishIds }) => setFavIds(new Set(dishIds))).catch(() => {})
    api.getFridge().then(({ items }) =>
      setFridgeIngredientIds(new Set(items.map(i => i.ingredientId)))
    ).catch(() => {})
  }, [token])

  const getParams = useCallback(() => ({
    q:          q || undefined,
    mealTime:   mealTime || undefined,
    fridgeMode: fridgeFilter ? 'true' : undefined,
    myKitchen:  token ? 'true' : undefined,
    favorites:  (token && favFilter) ? 'true' : undefined,
    limit:      LIMIT,
  }), [q, mealTime, fridgeFilter, favFilter, token])

  const load = useCallback(async () => {
    canLoadRef.current = false
    setLoading(true)
    offsetRef.current = 0
    try {
      const data = await api.getDishes({ ...getParams(), offset: 0 })
      const fetched = data.dishes ?? []
      const total   = data.total  ?? fetched.length
      setDishes(fetched)
      offsetRef.current = fetched.length
      setHasMore(fetched.length < total)
    } catch (e) {
      setDishes([])
      setHasMore(false)
      show(e.message || 'Не удалось загрузить блюда', 'error')
    } finally {
      setLoading(false)
    }
  }, [getParams, show])

  const loadMore = useCallback(async () => {
    if (!canLoadRef.current) return
    canLoadRef.current = false  // синхронно блокируем повторный вызов до ре-рендера
    setLoadingMore(true)
    try {
      const data = await api.getDishes({ ...getParams(), offset: offsetRef.current })
      const fetched = data.dishes ?? []
      const total   = data.total  ?? 0
      setDishes(prev => {
        const seen = new Set(prev.map(d => d.id))
        return [...prev, ...fetched.filter(d => !seen.has(d.id))]
      })
      offsetRef.current += fetched.length
      setHasMore(offsetRef.current < total)
    } catch {
      // silent — не сбрасываем список
    } finally {
      setLoadingMore(false)
    }
  }, [getParams])

  // Обновляем refs чтобы IntersectionObserver не захватывал устаревший callback
  useEffect(() => { loadMoreFnRef.current = loadMore }, [loadMore])
  useEffect(() => {
    canLoadRef.current = hasMore && !loadingMore && !loading
  }, [hasMore, loadingMore, loading])

  // Загрузка при смене фильтров
  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [load])

  // IntersectionObserver — срабатывает когда sentinel попадает в viewport
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && canLoadRef.current) loadMoreFnRef.current?.()
    }, { rootMargin: '200px' })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  function handleToggleFav(dishId) {
    const isFav = favIds.has(dishId)
    setFavIds(prev => {
      const next = new Set(prev)
      isFav ? next.delete(dishId) : next.add(dishId)
      return next
    })
    isFav ? api.removeFavorite(dishId).catch(() => {}) : api.addFavorite(dishId).catch(() => {})
  }

  async function handleAddToPlan(dish) {
    try {
      await api.addMealPlan({ dishId: dish.id })
      show(`«${dish.name}» добавлено на сегодня`, 'success')
    } catch (e) {
      show(e.message || 'Не удалось добавить', 'error')
    }
  }

  function resetFilters() {
    setQ('')
    setMealTime('')
    setFridgeFilter(false)
    setFavFilter(false)
  }

  return (
    <div className="flex flex-col pb-24 bg-bg min-h-full">

      {/* Title */}
      <h1 className="font-semibold text-[22px] text-text px-4 pt-5 pb-2">Мои блюда</h1>

      {/* SearchInput */}
      <div className="px-4">
        <SearchInput
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Поиск блюд..."
        />
      </div>

      {/* Quick filters */}
      {token && (
        <div className="px-4 mt-3">
          <QuickFilters
            fridgeActive={fridgeFilter}
            favActive={favFilter}
            filtersActive={!!mealTime}
            onToggleFridge={() => setFridgeFilter(v => !v)}
            onToggleFav={() => setFavFilter(v => !v)}
            onOpenFilters={() => setShowFilters(v => !v)}
          />
        </div>
      )}

      {/* Filter panel — mealTime */}
      {showFilters && (
        <div className="px-4 mt-3">
          <MealTypeChips active={mealTime} onChange={v => setMealTime(prev => prev === v ? '' : v)} />
        </div>
      )}

      {/* Быстрое добавление */}
      {token && (
        <div className="px-4 mt-3 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setShowBulkAdd(true)}
            className="text-[13px] font-medium text-text-2 hover:text-text transition-colors self-start"
          >
            Добавить несколько блюд →
          </button>

          {/* Однократный hint про запятые */}
          {!bulkAddHintDismissed && dishes.length > 0 && (
            <div className="flex items-center justify-between bg-white rounded-2xl px-4 py-3 shadow-sm">
              <p className="text-xs text-text-2">
                Используй <strong>Добавить несколько блюд</strong> — можно перечислить список через запятую
              </p>
              <button
                type="button"
                onClick={dismissBulkAddHint}
                className="ml-3 shrink-0 text-text-3 text-lg leading-none"
              >✕</button>
            </div>
          )}
        </div>
      )}

      {/* DishList */}
      <div className="px-4 mt-4">
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="w-full h-[76px] bg-white rounded-2xl animate-pulse shadow-sm" />
            ))}
          </div>
        ) : dishes.length === 0 ? (
          <RecipesEmptyState
            filter={favFilter || fridgeFilter ? 'filtered' : 'all'}
            mealTime={mealTime}
            q={q}
            isGuest={!token}
            onNavigate={navigate}
            onAddRecipe={() => navigate('/dishes/new')}
            onReset={resetFilters}
          />
        ) : (
          <DishList
            variant="row"
            dishes={dishes}
            loading={false}
            searchQuery={q || undefined}
            isFavSet={favIds}
            onToggleFav={token ? handleToggleFav : undefined}
            fridgeIngredientIds={fridgeIngredientIds}
            onAddToPlan={token ? handleAddToPlan : undefined}
            onDishClick={id => navigate(`/dishes/${id}`)}
          />
        )}

        {/* Sentinel для IntersectionObserver */}
        <div ref={sentinelRef} className="h-1" />

        {/* Спиннер подгрузки */}
        {loadingMore && (
          <div className="flex justify-center py-5">
            <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          </div>
        )}
      </div>

      {/* AddRecipeButton (FAB) */}
      {token && <AddRecipeButton onClick={() => navigate('/dishes/new')} />}

      {/* First-dish toast */}
      {showFirstDishToast && (
        <div className="fixed bottom-[88px] left-1/2 -translate-x-1/2 z-[9999] whitespace-nowrap
          bg-neutral-900 text-white text-sm px-5 py-2.5 rounded-full shadow-md"
        >
          Отлично! Добавь ещё или включи 🧊 режим холодильника
        </div>
      )}

      {/* BulkAddModal */}
      {Toast}

      {showBulkAdd && (
        <BulkAddModal
          onClose={() => setShowBulkAdd(false)}
          onDone={() => {
            setShowBulkAdd(false)
            if (dishes.length === 0 && !firstDishSeen) {
              markFirstDishSeen()
              setTimeout(() => {
                setShowFirstDishToast(true)
                setTimeout(() => setShowFirstDishToast(false), 3500)
              }, 800)
            }
            load()
          }}
        />
      )}
    </div>
  )
}
