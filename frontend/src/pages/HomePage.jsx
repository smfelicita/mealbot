import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useStore } from '../store'
import { DishCard } from '../components/domain'
import MealTypeChips from '../components/domain/MealTypeChips'
import { useHintDismiss } from '../hooks/useHintDismiss'

const CARD_GAP = 12 // gap-3 = 12px

// ─── GuestHeroBanner ──────────────────────────────────────────────────────────
function GuestHeroBanner({ onNavigate }) {
  const [visible, setVisible] = useState(
    () => !localStorage.getItem('mealbot_guest_banner_dismissed')
  )
  if (!visible) return null

  function dismiss() {
    localStorage.setItem('mealbot_guest_banner_dismissed', '1')
    setVisible(false)
  }

  return (
    <div className="relative bg-white rounded-2xl px-5 py-4 shrink-0 shadow-sm">
      <button
        type="button"
        onClick={dismiss}
        aria-label="Закрыть"
        className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full text-text-3 hover:text-text transition-colors text-lg leading-none"
      >✕</button>

      <p className="font-semibold text-[17px] leading-snug pr-6 text-text">
        Добавь свои блюда —<br />и больше не думай, что готовить
      </p>
      <p className="text-xs mt-1 mb-3 text-text-3">Займёт меньше минуты</p>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => onNavigate('/auth?mode=register')}
          className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity active:opacity-80 bg-accent"
        >
          Создать свою кухню
        </button>
        <button
          type="button"
          onClick={() => onNavigate('/auth')}
          className="w-full py-2 rounded-xl text-[13px] font-medium transition-colors text-text-3"
        >
          Уже есть аккаунт? Войти
        </button>
      </div>
    </div>
  )
}

function defaultMealTime() {
  const h = new Date().getHours()
  if (h < 11) return 'breakfast'
  if (h < 15) return 'lunch'
  if (h < 21) return 'dinner'
  return 'snack'
}

function SkeletonCard() {
  return (
    <div className="w-full flex items-center justify-between bg-white rounded-2xl p-4 animate-pulse shadow-sm">
      <div className="flex-1 pr-3 space-y-2">
        <div className="h-4 bg-bg-3 rounded-full w-3/4" />
        <div className="h-3 bg-bg-3 rounded-full w-1/2" />
      </div>
      <div className="w-16 h-16 rounded-xl bg-bg-3 shrink-0" />
    </div>
  )
}

export default function HomePage() {
  const navigate = useNavigate()
  const token    = useStore(s => s.token)
  const fridge   = useStore(s => s.fridge)

  const [dishes, setDishes]         = useState([])
  const [loading, setLoading]       = useState(true)
  const [mealTime, setMealTime]     = useState(defaultMealTime)
  const [favOnly, setFavOnly]       = useState(false)
  const [fridgeOnly, setFridgeOnly] = useState(false)
  const [favIds, setFavIds]         = useState(new Set())
  const [visibleCount, setVisibleCount] = useState(4)
  const [fridgeModeHintDismissed, dismissFridgeModeHint] = useHintDismiss('mealbot_hint_fridgeMode_seen')

  // Refs for measuring
  const listContainerRef = useRef(null)
  const firstCardRef     = useRef(null)

  const recalcCount = useCallback(() => {
    const container = listContainerRef.current
    const card      = firstCardRef.current
    if (!container || !card) return
    const containerH = container.clientHeight
    const cardH      = card.clientHeight
    if (containerH === 0 || cardH === 0) return
    const count = Math.max(1, Math.floor((containerH + CARD_GAP) / (cardH + CARD_GAP)))
    setVisibleCount(count)
  }, [])

  // Recalculate when container resizes (orientation change, window resize)
  useEffect(() => {
    const container = listContainerRef.current
    if (!container) return
    const ro = new ResizeObserver(recalcCount)
    ro.observe(container)
    return () => ro.disconnect()
  }, [recalcCount])

  // Recalculate after loading finishes or when any filter changes
  // (container size doesn't change, but we need fresh card measurement)
  useEffect(() => {
    if (!loading) {
      const raf = requestAnimationFrame(recalcCount)
      return () => cancelAnimationFrame(raf)
    }
  }, [loading, mealTime, favOnly, fridgeOnly, recalcCount])

  useEffect(() => {
    api.getDishes({ limit: 50 })
      .then(data => setDishes(data.dishes ?? data))
      .catch(() => {})
      .finally(() => setLoading(false))

    if (token) {
      api.getFavoriteIds().then(({ dishIds }) => setFavIds(new Set(dishIds))).catch(() => {})
    }
  }, [token])

  const fridgeIds = new Set(fridge.map(f => f.ingredientId))

  const filtered = dishes.filter(dish => {
    if (mealTime) {
      const mt = mealTime.toUpperCase()
      if (dish.mealTime?.length && !dish.mealTime.includes(mt)) return false
    }
    if (favOnly && !favIds.has(dish.id)) return false
    if (fridgeOnly) {
      const hasAll = dish.ingredients?.length > 0
        && dish.ingredients.every(i => i.toTaste || i.isBasic || fridgeIds.has(i.id))
      if (!hasAll) return false
    }
    return true
  })

  const visible = filtered.slice(0, visibleCount)

  return (
    <div className="flex flex-col flex-1 min-h-0 px-5 pt-6 pb-6 gap-5 bg-bg">

      {/* Heading */}
      <h1 className="text-[26px] font-semibold leading-[1.35] shrink-0 text-text">
        Что приготовить<br />сегодня?
      </h1>

      {/* Guest hero banner */}
      {!token && <GuestHeroBanner onNavigate={navigate} />}

      {/* Chips */}
      <div className="shrink-0">
        <MealTypeChips
          active={mealTime}
          onChange={v => { setMealTime(v); setFavOnly(false); setFridgeOnly(false) }}
          showAll
        />
      </div>

      {/* Recipe list — flex-1 takes remaining space, overflow hidden = no scroll */}
      <div
        ref={listContainerRef}
        className="flex-1 min-h-0 overflow-hidden flex flex-col"
        style={{ gap: CARD_GAP }}
      >
        {loading ? (
          [1, 2, 3, 4].map(i => <SkeletonCard key={i} />)
        ) : visible.length === 0 && fridgeOnly && fridge.length === 0 ? (
          <div className="bg-white rounded-2xl p-5 flex flex-col gap-3 shadow-sm">
            <p className="font-semibold text-[15px] text-text">Холодильник пуст</p>
            <p className="text-[13px] text-text-3">Добавь продукты чтобы видеть блюда из того, что есть дома</p>
            <button
              type="button"
              onClick={() => navigate('/fridge')}
              className="self-start px-4 py-2 rounded-xl text-[13px] font-semibold text-white bg-sage"
            >
              Заполнить холодильник
            </button>
          </div>
        ) : visible.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
            <p className="text-[15px] text-text-3">Нет подходящих блюд</p>
          </div>
        ) : visible.map((dish, idx) => (
          <DishCard
            key={dish.id}
            ref={idx === 0 ? firstCardRef : undefined}
            variant="row"
            dish={dish}
            isFav={favIds.has(dish.id)}
            onClick={() => navigate(`/dishes/${dish.id}`)}
          />
        ))}
      </div>

      {/* Однократный hint: fridge mode включён, холодильник пуст */}
      {token && fridgeOnly && fridge.length === 0 && !fridgeModeHintDismissed && (
        <div className="flex items-center justify-between bg-white rounded-2xl px-4 py-3 shrink-0 shadow-sm">
          <p className="text-[13px] text-text-2">
            Сначала добавь продукты в холодильник →
          </p>
          <button
            type="button"
            onClick={dismissFridgeModeHint}
            className="ml-3 shrink-0 text-text-3 text-lg leading-none"
          >✕</button>
        </div>
      )}

      {/* Добавить своё */}
      {!loading && visible.length > 0 && (
        <button
          type="button"
          onClick={() => navigate(token ? '/dishes/new' : '/auth?mode=register')}
          className="shrink-0 w-full py-3 rounded-2xl text-sm font-semibold transition-opacity active:opacity-75 bg-white text-accent shadow-sm"
        >
          + Добавить своё блюдо
        </button>
      )}

      {/* Quick actions */}
      {token && (
        <div className="flex gap-3 shrink-0">
          <button
            type="button"
            onClick={() => { setFavOnly(f => !f); setFridgeOnly(false); setMealTime('') }}
            className={`flex-1 flex items-center justify-center gap-2.5 rounded-2xl py-4 transition-all shadow-card ${favOnly ? 'bg-accent' : 'bg-sage'}`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 21C12 21 3 14.5 3 8.5C3 5.46 5.46 3 8.5 3C10.24 3 11.91 3.81 13 5.08C14.09 3.81 15.76 3 17.5 3C20.54 3 23 5.46 23 8.5C23 14.5 12 21 12 21Z" fill="rgba(255,255,255,0.9)"/>
            </svg>
            <span className="font-semibold text-sm text-white">Избранное</span>
          </button>

          <button
            type="button"
            onClick={() => { setFridgeOnly(f => !f); setFavOnly(false); setMealTime('') }}
            className={`flex-1 flex items-center justify-center gap-2.5 rounded-2xl py-4 transition-all shadow-card ${fridgeOnly ? 'bg-accent' : 'bg-sage'}`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="6" y="3" width="12" height="18" rx="2" stroke="rgba(255,255,255,0.9)" strokeWidth="2"/>
              <line x1="6" y1="10" x2="18" y2="10" stroke="rgba(255,255,255,0.9)" strokeWidth="2"/>
              <circle cx="10" cy="7" r="1.2" fill="rgba(255,255,255,0.9)"/>
              <circle cx="10" cy="15" r="1.2" fill="rgba(255,255,255,0.9)"/>
            </svg>
            <span className="font-semibold text-sm text-white">Холодильник</span>
          </button>
        </div>
      )}
    </div>
  )
}
