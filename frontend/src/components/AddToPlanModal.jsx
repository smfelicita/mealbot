import { useState } from 'react'
import { api } from '../api'
import { useToast } from '../hooks/useToast.jsx'

const MEAL_TYPES = [
  { value: 'BREAKFAST', label: '🌅 Завтрак' },
  { value: 'LUNCH',     label: '☀️ Обед' },
  { value: 'DINNER',    label: '🌙 Ужин' },
  { value: 'SNACK',     label: '🍎 Перекус' },
  { value: 'ANYTIME',   label: '🍽 Когда угодно' },
]

export default function AddToPlanModal({ dish, hasFamilyGroup, onClose, onAdded }) {
  const { show, Toast } = useToast()
  const [mealType, setMealType] = useState('ANYTIME')
  const [date, setDate] = useState('')
  const [note, setNote] = useState('')
  const [shared, setShared] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await api.addMealPlan({ dishId: dish.id, mealType, date: date || null, note: note || null, shared })
      onAdded?.()
      onClose()
    } catch (err) {
      show(err.message, 'error')
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>📅 В план питания</h2>
          <button className="btn btn-icon" onClick={onClose} aria-label="Закрыть">✕</button>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
          background: 'var(--bg3)', borderRadius: 'var(--radius-sm)', marginBottom: 20,
        }}>
          <span style={{ fontSize: 22 }}>
            {dish.images?.[0] || dish.imageUrl
              ? <img src={dish.images?.[0] || dish.imageUrl} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 8 }} />
              : '🍽'}
          </span>
          <strong style={{ fontSize: 15 }}>{dish.nameRu || dish.name}</strong>
        </div>

        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', fontSize: 12, color: 'var(--text2)', fontWeight: 700, marginBottom: 6 }}>
            ПРИЁМ ПИЩИ
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
            {MEAL_TYPES.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => setMealType(t.value)}
                className={mealType === t.value ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
              >
                {t.label}
              </button>
            ))}
          </div>

          <label style={{ display: 'block', fontSize: 12, color: 'var(--text2)', fontWeight: 700, marginBottom: 6 }}>
            ДАТА (НЕОБЯЗАТЕЛЬНО)
          </label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="input"
            style={{ marginBottom: 16, width: '100%' }}
          />

          <label style={{ display: 'block', fontSize: 12, color: 'var(--text2)', fontWeight: 700, marginBottom: 6 }}>
            ЗАМЕТКА
          </label>
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Например: без соли"
            className="input"
            style={{ marginBottom: 16, width: '100%' }}
          />

          {hasFamilyGroup && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, cursor: 'pointer' }}>
              <input type="checkbox" checked={shared} onChange={e => setShared(e.target.checked)} style={{ width: 18, height: 18 }} />
              <span style={{ fontSize: 14 }}>🏠 Добавить в общий семейный план</span>
            </label>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Добавляю...' : 'Добавить в план'}
          </button>
        </form>

        {Toast}
      </div>
    </div>
  )
}
