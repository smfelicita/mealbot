// HomePage — главная страница.
// Три состояния: guest / user с пустым холодильником / user рабочий вид.
// Портировано из context/design/home-v2.jsx, токены через Tailwind (bg-accent, text-sage и т.п.)

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronRight, Heart, Refrigerator,
  Sun, Utensils, Moon, Cookie,
  Plus, Clock, Flame, Sparkles,
  BookOpen, CalendarDays,
} from 'lucide-react'

import { api } from '../api'
import { useStore } from '../store'
import { DishCardV2 } from '../components/domain'
import {
  PageHeader,
  MetaStrip,
  GuestBlock,
  HintBanner,
  Button,
  useToast,
} from '../components/ui'

// ─── Meal times (локальный reference) ────────────────────────────
const MEAL_TIMES = [
  { id: 'breakfast', label: 'Завтрак', Icon: Sun       },
  { id: 'lunch',     label: 'Обед',    Icon: Utensils  },
  { id: 'dinner',    label: 'Ужин',    Icon: Moon      },
  { id: 'snack',     label: 'Перекус', Icon: Cookie    },
]

// ═══ MealChips ═══════════════════════════════════════════════════
// Инлайновые chips с иконками (v2-вариант), чтобы не править общий MealTypeChips.
function MealChips({ active, onChange }) {
  const all = [{ id: '', label: 'Все', Icon: null }, ...MEAL_TIMES]
  return (
    <div className="overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
      <div className="flex gap-1.5 w-max">
        {all.map(({ id, label, Icon }) => {
          const isActive = id === active
          return (
            <button
              key={id || 'all'}
              type="button"
              onClick={() => onChange(id)}
              className={[
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full',
                'text-[12.5px] font-bold transition-colors flex-shrink-0 border',
                isActive
                  ? 'bg-accent-muted border-accent-border text-accent'
                  : 'bg-bg-2 border-border text-text-2',
              ].join(' ')}
            >
              {Icon && <Icon size={14} strokeWidth={2} />}
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ═══ FridgeSuggest ═══════════════════════════════════════════════
function FridgeSuggest({ count, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl flex items-center gap-2.5 text-left
        bg-sage-muted border border-sage-border px-3.5 py-2.5
        hover:opacity-90 transition-opacity"
    >
      <Refrigerator size={16} strokeWidth={2} className="text-sage shrink-0" />
      <div className="flex-1 text-[12.5px] font-bold text-sage">
        Из вашего холодильника можно приготовить{' '}
        <span className="tabular-nums">{count}</span> блюд
      </div>
      <ChevronRight size={14} strokeWidth={2.2} className="text-sage shrink-0" />
    </button>
  )
}

// ═══ TodayPinned ═════════════════════════════════════════════════
function TodayPinned({ dish, img, onCook, onOpen }) {
  return (
    <div className="rounded-2xl bg-accent-muted border border-accent-border p-2.5">
      <div className="flex items-center gap-1.5 mb-2 px-1">
        <Flame size={12} strokeWidth={2.4} className="text-accent" />
        <span className="text-[10.5px] font-bold uppercase tracking-wider text-accent">
          Сегодня в плане
        </span>
      </div>
      <div className="flex items-center gap-3 rounded-xl bg-bg-2 p-2">
        <button
          type="button"
          onClick={onOpen}
          className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-border
            bg-bg-3 flex items-center justify-center"
        >
          {img
            ? <img src={img} alt="" className="w-full h-full object-cover" />
            : <Utensils size={20} className="text-text-3" />
          }
        </button>
        <div className="flex-1 min-w-0">
          <div
            className="text-[13.5px] font-bold leading-tight text-text"
            style={{ textWrap: 'pretty' }}
          >
            {dish.name}
          </div>
          {dish.cookTime && (
            <div className="flex items-center gap-2 mt-1 text-[11.5px] text-text-2">
              <span className="flex items-center gap-0.5">
                <Clock size={10} strokeWidth={2.2} />
                {dish.cookTime} мин
              </span>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onCook}
          className="h-9 px-3.5 rounded-full text-[12.5px] font-bold text-white
            bg-accent shrink-0 hover:bg-accent-2 transition-colors"
        >
          Готовлю!
        </button>
      </div>
    </div>
  )
}

// ═══ QuickActions ════════════════════════════════════════════════
function QuickActions({ favActive, fridgeActive, onFav, onFridge }) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={onFav}
        className={[
          'flex-1 h-11 rounded-full flex items-center justify-center gap-2',
          'text-[13px] font-bold transition-colors border',
          favActive
            ? 'bg-accent text-white border-accent'
            : 'bg-bg-2 text-text-2 border-border hover:text-accent hover:border-accent',
        ].join(' ')}
      >
        <Heart size={14} strokeWidth={2.4} fill={favActive ? '#fff' : 'none'} />
        Избранное
      </button>
      <button
        type="button"
        onClick={onFridge}
        className={[
          'flex-1 h-11 rounded-full flex items-center justify-center gap-2',
          'text-[13px] font-bold transition-colors border',
          fridgeActive
            ? 'bg-sage text-white border-sage'
            : 'bg-sage-muted text-sage border-sage-border hover:opacity-90',
        ].join(' ')}
      >
        <Refrigerator size={14} strokeWidth={2.4} />
        Холодильник
      </button>
    </div>
  )
}

// ═══ AddOwnDish ══════════════════════════════════════════════════
function AddOwnDish({ guest, onClick }) {
  if (guest) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="w-full h-12 rounded-full text-[14px] font-bold text-white
          flex items-center justify-center gap-2 bg-accent hover:bg-accent-2 transition-colors"
        style={{ boxShadow: '0 6px 18px rgba(196,112,74,0.35)' }}
      >
        <Sparkles size={16} strokeWidth={2.2} />
        Создать свою кухню
      </button>
    )
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full h-12 rounded-full text-[14px] font-bold
        flex items-center justify-center gap-2
        bg-bg-2 text-accent border border-dashed border-accent-border
        hover:bg-accent-muted transition-colors"
    >
      <Plus size={16} strokeWidth={2.4} />
      Добавить своё блюдо
    </button>
  )
}

// ═══ HomePage ══════════════════════════════════════════════════
export default function HomePage() {
  const navigate = useNavigate()
  const token    = useStore(s => s.token)
  const user     = useStore(s => s.user)
  const fridge   = useStore(s => s.fridge)
  const planDishIds = useStore(s => s.planDishIds)
  const { show, Toast } = useToast()

  const [dishes,    setDishes]    = useState([])
  const [loading,   setLoading]   = useState(true)
  const [mealTime,  setMealTime]  = useState('')
  const [favOnly,   setFavOnly]   = useState(false)
  const [fridgeOnly, setFridgeOnly] = useState(false)
  const [favIds,    setFavIds]    = useState(new Set())

  const guest = !token

  useEffect(() => {
    api.getDishes({ limit: 50 })
      .then(data => setDishes(data.dishes ?? data))
      .catch(e => show(e.message || 'Не удалось загрузить блюда', 'error'))
      .finally(() => setLoading(false))

    if (token) {
      api.getFavoriteIds()
        .then(({ dishIds }) => setFavIds(new Set(dishIds)))
        .catch(() => {})
    }
  }, [token])

  const fridgeIds = new Set(fridge.map(f => f.ingredientId))

  // Считаем, сколько блюд можно приготовить из холодильника
  const fridgeReadyCount = token && fridge.length > 0
    ? dishes.filter(d =>
        d.ingredients?.length > 0 &&
        d.ingredients.every(i => i.toTaste || i.isBasic || fridgeIds.has(i.id))
      ).length
    : 0

  // Первое запланированное блюдо — для TodayPinned
  const plannedDish = token && planDishIds.size > 0
    ? dishes.find(d => planDishIds.has(d.id))
    : null

  // Determine variant:
  //   'guest'  — нет токена
  //   'empty'  — залогинен, но холодильник пустой
  //   'normal' — залогинен и холодильник не пустой
  const variant = guest ? 'guest' : (fridge.length === 0 ? 'empty' : 'normal')

  const metrics = guest ? null : [
    {
      icon:  <CalendarDays size={16} strokeWidth={2.2} />,
      value: planDishIds.size,
      label: 'В плане',
      accent: 'accent',
    },
    {
      icon:  <Refrigerator size={16} strokeWidth={2.2} />,
      value: fridge.length,
      label: 'В холодильнике',
      accent: 'sage',
    },
    {
      icon:  <Heart size={16} strokeWidth={2.2} />,
      value: favIds.size,
      label: 'В избранном',
      accent: 'pro',
    },
  ]

  function handleToggleFav(dishId) {
    if (!token) return
    const isFav = favIds.has(dishId)
    setFavIds(prev => {
      const next = new Set(prev)
      isFav ? next.delete(dishId) : next.add(dishId)
      return next
    })
    isFav
      ? api.removeFavorite(dishId).catch(() => {})
      : api.addFavorite(dishId).catch(() => {})
  }

  async function handleAddToPlan(dish) {
    try {
      await api.addMealPlan({ dishId: dish.id })
      show(`«${dish.name}» добавлено на сегодня`, 'success')
    } catch (e) {
      show(e.message || 'Не удалось добавить', 'error')
    }
  }

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

  const greeting = user?.name ? `Добрый день, ${user.name} 👋` : null

  return (
    <div className="flex flex-col flex-1 bg-bg pb-6">
      {/* ── Title ───────────────────────────────────────────────── */}
      <PageHeader
        subtitle={guest ? null : greeting}
        title={<>Что приготовить<br />сегодня?</>}
      />

      {/* ── Guest banner ─────────────────────────────────────────── */}
      {guest && (
        <div className="px-5 mt-4">
          <GuestBlock
            variant="banner"
            icon={<Sparkles size={18} strokeWidth={2.2} />}
            title="Добавь свои блюда — и больше не думай, что готовить"
            description="Подборка по холодильнику, план на неделю, любимые рецепты."
            registerText="Создать свою кухню"
            loginText="Войти"
            storageKey="mealbot_guest_banner_dismissed"
            dismissible
          />
        </div>
      )}

      {/* ── Empty-fridge hint ────────────────────────────────────── */}
      {variant === 'empty' && (
        <div className="px-5 mt-4">
          <HintBanner
            variant="sage"
            icon={<Refrigerator size={17} strokeWidth={2} />}
            title="Заполни холодильник"
          >
            Покажем рецепты из того, что есть дома
          </HintBanner>
        </div>
      )}

      {/* ── Day meta ─────────────────────────────────────────────── */}
      {metrics && (
        <div className="px-5 mt-4">
          <MetaStrip items={metrics} />
        </div>
      )}

      {/* ── Meal chips ───────────────────────────────────────────── */}
      <div className="px-5 mt-5">
        <MealChips
          active={mealTime}
          onChange={v => { setMealTime(v); setFavOnly(false); setFridgeOnly(false) }}
        />
      </div>

      {/* ── Fridge suggest ───────────────────────────────────────── */}
      {variant === 'normal' && fridgeReadyCount > 0 && (
        <div className="px-5 mt-4">
          <FridgeSuggest
            count={fridgeReadyCount}
            onClick={() => setFridgeOnly(true)}
          />
        </div>
      )}

      {/* ── Today pinned ─────────────────────────────────────────── */}
      {variant === 'normal' && plannedDish && (
        <div className="px-5 mt-4">
          <TodayPinned
            dish={plannedDish}
            img={plannedDish.images?.[0] || plannedDish.imageUrl}
            onCook={() => navigate(`/dishes/${plannedDish.id}`)}
            onOpen={() => navigate(`/dishes/${plannedDish.id}`)}
          />
        </div>
      )}

      {/* ── Dish list ────────────────────────────────────────────── */}
      <div className="px-5 mt-4 flex flex-col gap-2">
        {loading ? (
          <div className="bg-bg-2 border border-border rounded-2xl p-6 text-center text-[14px] text-text-3">
            Загружаем блюда…
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-bg-2 border border-border rounded-2xl p-6 text-center">
            <p className="text-[14px] text-text-3">Нет подходящих блюд</p>
          </div>
        ) : (
          filtered.slice(0, 8).map(dish => (
            <DishCardV2
              key={dish.id}
              dish={dish}
              isFav={favIds.has(dish.id)}
              onToggleFav={token ? handleToggleFav : undefined}
              fridgeIngredientIds={token ? fridgeIds : undefined}
              onAddToPlan={token ? handleAddToPlan : undefined}
              onClick={() => navigate(`/dishes/${dish.id}`)}
            />
          ))
        )}
      </div>

      {/* ── Add own dish ─────────────────────────────────────────── */}
      {!loading && (
        <div className="px-5 mt-4">
          <AddOwnDish
            guest={guest}
            onClick={() => navigate(guest ? '/auth?mode=register' : '/dishes/new')}
          />
        </div>
      )}

      {/* ── Quick actions ────────────────────────────────────────── */}
      {variant === 'normal' && (
        <div className="px-5 mt-3">
          <QuickActions
            favActive={favOnly}
            fridgeActive={fridgeOnly}
            onFav={() => { setFavOnly(f => !f); setFridgeOnly(false); setMealTime('') }}
            onFridge={() => { setFridgeOnly(f => !f); setFavOnly(false); setMealTime('') }}
          />
        </div>
      )}

      {Toast}
    </div>
  )
}
