import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useStore } from '../store'
import { Button, Loader, EmptyState, useToast } from '../components/ui'
import { PlanItem } from '../components/domain'

const MEAL_RU = {
  BREAKFAST: 'Завтрак',
  LUNCH:     'Обед',
  DINNER:    'Ужин',
  SNACK:     'Перекус',
  ANYTIME:   null,
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

// ─── Guest block ─────────────────────────────────────────────────────────────
function GuestMealPlanBlock() {
  const navigate = useNavigate()
  return (
    <div className="px-4 pt-5 pb-24">
      <h1 className="font-serif text-[22px] font-extrabold mb-5">📅 Буду готовить</h1>
      <EmptyState
        icon="📅"
        title="Планируй меню заранее"
        description="Добавляй блюда на неделю вперёд — и больше не думай, что готовить каждый день"
        action={
          <div className="flex flex-col gap-2 w-full px-4">
            <Button className="w-full" onClick={() => navigate('/auth?mode=register')}>
              Создать свою кухню
            </Button>
            <Button variant="ghost" size="sm" className="text-text-2"
              onClick={() => navigate('/auth')}>
              Уже есть аккаунт? Войти
            </Button>
          </div>
        }
      />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function MealPlanPage() {
  const navigate = useNavigate()
  const { user, token } = useStore(s => ({ user: s.user, token: s.token }))
  const { show, Toast } = useToast()

  const [plans, setPlans]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) loadPlans()
  }, [token])

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

  if (!token) return <GuestMealPlanBlock />
  if (loading) return <Loader fullPage />

  return (
    <div className="px-4 pt-5 pb-24 fade-in">
      <h1 className="font-serif text-[22px] font-extrabold mb-5">📅 Буду готовить</h1>

      {plans.length === 0 ? (
        <EmptyState
          icon="📋"
          title="Список пуст"
          description="Добавляй блюда в план прямо из карточки рецепта — кнопка 📅 Буду готовить"
          action={
            <Button onClick={() => navigate('/dishes')}>Посмотреть блюда</Button>
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
            <p className="text-xs font-bold text-text-2 uppercase tracking-widest pb-2 mb-3 border-b border-border">
              {dateLabel}
            </p>

            {/* Meal groups */}
            {MEAL_ORDER.filter(mt => byMeal[mt]).map(mt => (
              <div key={mt} className="mb-4">
                {MEAL_RU[mt] && <p className="text-[13px] font-bold text-text mb-2">{MEAL_RU[mt]}</p>}
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
