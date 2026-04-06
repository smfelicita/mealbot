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
  }).slice(0, 5)

  return (
    <div className="flex flex-col gap-5 px-4 pt-2 pb-4">

      {/* Heading */}
      <h1 className="text-[28px] font-bold text-text leading-tight">
        Что приготовить<br />сегодня?
      </h1>

      {/* Chips */}
      <MealTypeChips
        active={mealTime}
        onChange={v => { setMealTime(v); setFavOnly(false); setFridgeOnly(false) }}
        showAll
      />

      {/* Recipe list */}
      <div className="flex flex-col gap-2.5">
        {loading ? (
          [1,2,3,4].map(i => <SkeletonCard key={i} />)
        ) : filtered.length === 0 ? (
          <div className="bg-white shadow-sm rounded-2xl p-6 text-center">
            <p className="text-text-2 text-[15px]">Нет подходящих блюд</p>
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
            className={[
              'flex-1 flex items-center gap-3 rounded-2xl p-4 transition-all shadow-sm',
              favOnly ? 'bg-accent text-white' : 'bg-sage text-white',
            ].join(' ')}
          >
            <span className="text-[22px] leading-none shrink-0">❤️</span>
            <div className="text-left">
              <p className="font-semibold text-[14px] leading-tight">Избранное</p>
              <p className="text-[12px] opacity-80">Ваши любимые</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => { setFridgeOnly(f => !f); setFavOnly(false); setMealTime('') }}
            className={[
              'flex-1 flex items-center gap-3 rounded-2xl p-4 transition-all shadow-sm',
              fridgeOnly ? 'bg-accent text-white' : 'bg-sage text-white',
            ].join(' ')}
          >
            <span className="text-[22px] leading-none shrink-0">🧊</span>
            <div className="text-left">
              <p className="font-semibold text-[14px] leading-tight">Из холодильника</p>
              <p className="text-[12px] opacity-80">Есть ингредиенты</p>
            </div>
          </button>
        </div>
      )}
    </div>
  )
}
