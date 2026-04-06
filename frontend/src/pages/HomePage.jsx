import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useStore } from '../store'
import { RecipeCard } from '../components/domain'
import MealTypeChips from '../components/domain/MealTypeChips'

function defaultMealTime() {
  const h = new Date().getHours()
  if (h < 11) return 'breakfast'
  if (h < 15) return 'lunch'
  if (h < 21) return 'dinner'
  return 'snack'
}

function SkeletonCard() {
  return (
    <div className="w-full flex items-center justify-between bg-white shadow-sm rounded-2xl p-4 animate-pulse">
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

  useEffect(() => {
    api.getDishes({ limit: 20 })
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
      const mtToCategory = { breakfast: 'BREAKFAST', lunch: 'LUNCH', dinner: 'DINNER', snack: 'SNACK' }
      const cat = mtToCategory[mealTime]
      if (cat && dish.categories?.length && !dish.categories.includes(cat)) return false
    }
    if (favOnly && !favIds.has(dish.id)) return false
    if (fridgeOnly) {
      const hasAll = dish.ingredients?.length > 0
        && dish.ingredients.every(i => i.toTaste || i.isBasic || fridgeIds.has(i.id))
      if (!hasAll) return false
    }
    return true
  }).slice(0, 15)

  return (
    <div className="flex flex-col px-5 pt-6 pb-6 gap-6" style={{ background: '#F5F3EF', minHeight: '100%' }}>

      {/* Heading */}
      <h1 className="text-[26px] font-semibold leading-[1.35]" style={{ color: '#1a1a1a' }}>
        Что приготовить<br />сегодня?
      </h1>

      {/* Chips */}
      <MealTypeChips
        active={mealTime}
        onChange={v => { setMealTime(v); setFavOnly(false); setFridgeOnly(false) }}
        showAll
      />

      {/* Recipe list */}
      <div className="flex flex-col gap-3">
        {loading ? (
          [1,2,3,4].map(i => <SkeletonCard key={i} />)
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center" style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
            <p className="text-[15px]" style={{ color: '#9e9e9e' }}>Нет подходящих блюд</p>
          </div>
        ) : filtered.map(dish => (
          <RecipeCard
            key={dish.id}
            variant="row"
            dish={dish}
            isFav={favIds.has(dish.id)}
            onClick={() => navigate(`/dishes/${dish.id}`)}
          />
        ))}
      </div>

      {/* Quick actions */}
      {token && (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => { setFavOnly(f => !f); setFridgeOnly(false); setMealTime('') }}
            className="flex-1 flex items-center justify-center gap-2.5 rounded-2xl py-4 transition-all"
            style={{
              background: favOnly ? '#C4704A' : '#5C7A59',
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 21C12 21 3 14.5 3 8.5C3 5.46 5.46 3 8.5 3C10.24 3 11.91 3.81 13 5.08C14.09 3.81 15.76 3 17.5 3C20.54 3 23 5.46 23 8.5C23 14.5 12 21 12 21Z" fill="rgba(255,255,255,0.9)" stroke="none"/>
            </svg>
            <span className="font-semibold text-[14px] text-white">Избранное</span>
          </button>

          <button
            type="button"
            onClick={() => { setFridgeOnly(f => !f); setFavOnly(false); setMealTime('') }}
            className="flex-1 flex items-center justify-center gap-2.5 rounded-2xl py-4 transition-all"
            style={{
              background: fridgeOnly ? '#C4704A' : '#5C7A59',
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="6" y="3" width="12" height="18" rx="2" stroke="rgba(255,255,255,0.9)" strokeWidth="2" fill="none"/>
              <line x1="6" y1="10" x2="18" y2="10" stroke="rgba(255,255,255,0.9)" strokeWidth="2"/>
              <circle cx="10" cy="7" r="1.2" fill="rgba(255,255,255,0.9)"/>
              <circle cx="10" cy="15" r="1.2" fill="rgba(255,255,255,0.9)"/>
            </svg>
            <span className="font-semibold text-[14px] text-white">Холодильник</span>
          </button>
        </div>
      )}
    </div>
  )
}
