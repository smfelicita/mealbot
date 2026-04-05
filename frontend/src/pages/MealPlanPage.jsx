import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useStore } from '../store'
import { Button, Loader, EmptyState, useToast } from '../components/ui'

const MEAL_RU = {
  BREAKFAST: '🌅 Завтрак',
  LUNCH:     '☀️ Обед',
  DINNER:    '🌙 Ужин',
  SNACK:     '🍎 Перекус',
  ANYTIME:   '🍽 Без привязки',
}

const MEAL_ORDER = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK', 'ANYTIME']

function formatDate(dateStr) {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    weekday: 'short', day: 'numeric', month: 'long',
  })
}

function groupByDate(plans) {
  const map = new Map()
  for (const p of plans) {
    const key = p.date ? p.date.slice(0, 10) : 'no-date'
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(p)
  }
  return map
}

// ─── Plan card ────────────────────────────────────────────────────────────────
function PlanItem({ plan, currentUserId, onNavigate, onRemove }) {
  const dish = plan.dish
  const img  = dish.images?.[0] || dish.imageUrl
  const isOwn = plan.userId === currentUserId

  return (
    <div className="flex items-center gap-2.5 bg-bg-2 border border-border rounded-sm px-3 py-2.5">
      {/* Thumbnail */}
      <button
        type="button"
        onClick={onNavigate}
        className="shrink-0 w-11 h-11 rounded-sm overflow-hidden bg-bg-3 flex items-center justify-center text-[22px]"
      >
        {img
          ? <img src={img} alt="" className="w-full h-full object-cover" />
          : '🍽'}
      </button>

      {/* Info */}
      <button
        type="button"
        onClick={onNavigate}
        className="flex-1 min-w-0 text-left"
      >
        <p className="font-bold text-[14px] truncate">{dish.nameRu || dish.name}</p>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          {plan.groupId && (
            <span className="text-[11px] text-teal font-semibold">🏠 Семейный</span>
          )}
          {plan.note && (
            <span className="text-[11px] text-text-2">{plan.note}</span>
          )}
          {!isOwn && plan.user && (
            <span className="text-[11px] text-text-3">· {plan.user.name}</span>
          )}
        </div>
      </button>

      {/* Remove */}
      {isOwn && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Убрать"
          className="text-text-3 hover:text-red-400 text-base px-1 shrink-0"
        >✕</button>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function MealPlanPage() {
  const navigate = useNavigate()
  const user = useStore(s => s.user)
  const { show, Toast } = useToast()

  const [plans, setPlans]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadPlans() }, [])

  async function loadPlans() {
    try {
      setPlans(await api.getMealPlans())
    } catch (e) {
      show(e.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  async function removePlan(id) {
    try {
      await api.deleteMealPlan(id)
      setPlans(p => p.filter(x => x.id !== id))
    } catch (e) {
      show(e.message, 'error')
    }
  }

  const grouped   = groupByDate(plans)
  const sortedKeys = [...grouped.keys()].sort((a, b) => {
    if (a === 'no-date') return 1
    if (b === 'no-date') return -1
    return a.localeCompare(b)
  })

  if (loading) return <Loader fullPage />

  return (
    <div className="px-4 pt-5 pb-24 fade-in">
      <h1 className="font-serif text-[22px] font-extrabold mb-5">📅 Буду готовить</h1>

      {plans.length === 0 ? (
        <EmptyState
          icon="📋"
          title="Список пуст"
          description="Добавляйте блюда, которые хотите приготовить"
          action={
            <Button onClick={() => navigate('/dishes')}>Выбрать блюда</Button>
          }
        />
      ) : sortedKeys.map(dateKey => {
        const dayPlans  = grouped.get(dateKey)
        const dateLabel = dateKey === 'no-date' ? 'Без даты' : formatDate(dayPlans[0].date)

        const byMeal = {}
        for (const p of dayPlans) {
          if (!byMeal[p.mealType]) byMeal[p.mealType] = []
          byMeal[p.mealType].push(p)
        }

        return (
          <div key={dateKey} className="mb-7">
            {/* Day header */}
            <p className="text-[12px] font-bold text-text-2 uppercase tracking-widest pb-2 mb-3 border-b border-border">
              {dateLabel}
            </p>

            {/* Meal groups */}
            {MEAL_ORDER.filter(mt => byMeal[mt]).map(mt => (
              <div key={mt} className="mb-4">
                <p className="text-[13px] font-bold text-text mb-2">{MEAL_RU[mt]}</p>
                <div className="flex flex-col gap-2">
                  {byMeal[mt].map(plan => (
                    <PlanItem
                      key={plan.id}
                      plan={plan}
                      currentUserId={user?.id}
                      onNavigate={() => navigate(`/dishes/${plan.dish.id}`)}
                      onRemove={() => removePlan(plan.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      })}

      {Toast}
    </div>
  )
}
