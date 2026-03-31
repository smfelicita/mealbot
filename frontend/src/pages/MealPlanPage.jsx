import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useStore } from '../store'
import { useToast } from '../hooks/useToast.jsx'
import DishCard from '../components/DishCard'

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
  const d = new Date(dateStr)
  return d.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'long' })
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

export default function MealPlanPage() {
  const navigate = useNavigate()
  const user = useStore(s => s.user)
  const { show, Toast } = useToast()
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [pushEnabled, setPushEnabled] = useState(false)
  const [pushLoading, setPushLoading] = useState(false)

  useEffect(() => {
    loadPlans()
    checkPushStatus()
  }, [])

  async function loadPlans() {
    try {
      const data = await api.getMealPlans()
      setPlans(data)
    } catch (e) {
      show(e.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  async function checkPushStatus() {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return
    if (Notification.permission === 'granted') {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      setPushEnabled(!!sub)
    }
  }

  async function togglePush() {
    setPushLoading(true)
    try {
      if (pushEnabled) {
        const reg = await navigator.serviceWorker.ready
        const sub = await reg.pushManager.getSubscription()
        if (sub) {
          await api.unsubscribePush(sub.endpoint)
          await sub.unsubscribe()
        }
        setPushEnabled(false)
        show('Уведомления отключены')
      } else {
        const perm = await Notification.requestPermission()
        if (perm !== 'granted') {
          show('Разрешите уведомления в настройках браузера', 'error')
          return
        }
        const { publicKey } = await api.getVapidKey()
        const reg = await navigator.serviceWorker.ready
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        })
        const json = sub.toJSON()
        await api.subscribePush({ endpoint: json.endpoint, keys: json.keys })
        setPushEnabled(true)
        show('Уведомления включены!')
      }
    } catch (e) {
      show(e.message, 'error')
    } finally {
      setPushLoading(false)
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

  const grouped = groupByDate(plans)

  const sortedKeys = [...grouped.keys()].sort((a, b) => {
    if (a === 'no-date') return 1
    if (b === 'no-date') return -1
    return a.localeCompare(b)
  })

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60dvh' }}>
      <div className="loader" />
    </div>
  )

  return (
    <div className="page fade-in" style={{ paddingBottom: 100 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-serif)', margin: 0 }}>📅 План питания</h1>
        {'Notification' in window && (
          <button
            className={pushEnabled ? 'btn btn-secondary btn-sm' : 'btn btn-ghost btn-sm'}
            onClick={togglePush}
            disabled={pushLoading}
            title={pushEnabled ? 'Отключить уведомления' : 'Включить уведомления'}
          >
            {pushLoading ? '...' : pushEnabled ? '🔔 Вкл' : '🔕 Выкл'}
          </button>
        )}
      </div>

      {plans.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--text2)', padding: '40px 16px' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
          <p style={{ marginBottom: 16 }}>Ваш план пуст</p>
          <button className="btn btn-primary" onClick={() => navigate('/dishes')}>
            Выбрать блюда
          </button>
        </div>
      )}

      {sortedKeys.map(dateKey => {
        const dayPlans = grouped.get(dateKey)
        const dateLabel = dateKey === 'no-date' ? 'Без даты' : formatDate(dayPlans[0].date)

        // group by mealType within the day
        const byMeal = {}
        for (const p of dayPlans) {
          if (!byMeal[p.mealType]) byMeal[p.mealType] = []
          byMeal[p.mealType].push(p)
        }

        return (
          <div key={dateKey} style={{ marginBottom: 28 }}>
            <div style={{
              fontSize: 13, fontWeight: 700, color: 'var(--text2)',
              letterSpacing: '.05em', textTransform: 'uppercase',
              marginBottom: 12, paddingBottom: 8,
              borderBottom: '1px solid var(--border)',
            }}>
              {dateLabel}
            </div>

            {MEAL_ORDER.filter(mt => byMeal[mt]).map(mt => (
              <div key={mt} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)', marginBottom: 8 }}>
                  {MEAL_RU[mt]}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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

function PlanItem({ plan, currentUserId, onNavigate, onRemove }) {
  const dish = plan.dish
  const img = dish.images?.[0] || dish.imageUrl
  const isOwn = plan.userId === currentUserId

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      background: 'var(--bg2)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-sm)', padding: '10px 12px',
    }}>
      <div
        onClick={onNavigate}
        style={{
          flexShrink: 0, width: 44, height: 44, borderRadius: 8, overflow: 'hidden',
          background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, cursor: 'pointer',
        }}
      >
        {img ? <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🍽'}
      </div>
      <div onClick={onNavigate} role="button" style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}>
        <div style={{ fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {dish.nameRu || dish.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
          {plan.groupId && (
            <span style={{ fontSize: 11, color: 'var(--teal)', fontWeight: 600 }}>🏠 Семейный</span>
          )}
          {plan.note && (
            <span style={{ fontSize: 11, color: 'var(--text2)' }}>{plan.note}</span>
          )}
          {!isOwn && plan.user && (
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>· {plan.user.name}</span>
          )}
        </div>
      </div>
      {isOwn && (
        <button
          className="btn btn-icon"
          style={{ color: 'var(--text3)', minWidth: 32, minHeight: 32, fontSize: 16 }}
          onClick={onRemove}
          aria-label="Убрать из плана"
        >
          ✕
        </button>
      )}
    </div>
  )
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}
