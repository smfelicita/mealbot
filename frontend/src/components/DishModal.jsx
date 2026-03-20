import React, { useEffect } from 'react'

export default function DishModal({ dish, onClose }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const handler = e => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', handler)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handler)
    }
  }, [onClose])

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,.75)',
        display: 'flex', alignItems: 'flex-end',
        padding: 0,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="fade-up"
        style={{
          width: '100%', maxWidth: 600, margin: '0 auto',
          background: 'var(--bg2)', borderRadius: '20px 20px 0 0',
          maxHeight: '85dvh', overflowY: 'auto',
          padding: '1.5rem 1.2rem 2.5rem',
          borderTop: '1px solid var(--border)',
        }}
      >
        {/* Handle */}
        <div style={{
          width: 36, height: 4, borderRadius: 2,
          background: 'var(--text3)', margin: '0 auto 1.2rem',
        }} />

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <h2 style={{ fontFamily: 'var(--font-d)', fontSize: '1.5rem', lineHeight: 1.2, flex: 1 }}>
            {dish.name}
          </h2>
          <button onClick={onClose} style={{
            background: 'var(--bg3)', borderRadius: '50%',
            width: 32, height: 32, color: 'var(--text2)', fontSize: '1.1rem',
            flexShrink: 0, marginLeft: '1rem',
          }}>
            ✕
          </button>
        </div>

        {dish.description && (
          <p style={{ color: 'var(--text2)', marginBottom: '1rem', lineHeight: 1.6 }}>
            {dish.description}
          </p>
        )}

        {/* Meta */}
        <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap', marginBottom: '1.2rem' }}>
          {dish.cookTime && <MetaBadge icon="⏱️" text={`${dish.cookTime} мин`} />}
          {dish.calories && <MetaBadge icon="🔥" text={`${dish.calories} ккал`} />}
          {dish.mealTime?.map(mt => <MetaBadge key={mt} text={mealLabel(mt)} />)}
        </div>

        {/* Ingredients */}
        {dish.ingredients?.length > 0 && (
          <section style={{ marginBottom: '1.2rem' }}>
            <h3 style={{ fontWeight: 800, marginBottom: '.6rem', fontSize: '1rem' }}>
              🛒 Ингредиенты
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem' }}>
              {dish.ingredients.map(ing => (
                <span key={ing.id} style={{
                  background: 'var(--bg3)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)', padding: '.35rem .7rem',
                  fontSize: '.85rem', display: 'flex', alignItems: 'center', gap: '.3rem',
                }}>
                  {ing.emoji && <span>{ing.emoji}</span>}
                  {ing.name}
                  {ing.amount && <span style={{ color: 'var(--text2)', fontSize: '.75rem' }}>{ing.amount}</span>}
                  {ing.optional && <span style={{ color: 'var(--text3)', fontSize: '.7rem' }}>(необяз.)</span>}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Recipe */}
        {dish.recipe && (
          <section>
            <h3 style={{ fontWeight: 800, marginBottom: '.8rem', fontSize: '1rem' }}>
              📋 Рецепт
            </h3>
            <div style={{
              background: 'var(--bg3)', borderRadius: 'var(--radius-sm)',
              padding: '1rem', lineHeight: 1.7, fontSize: '.9rem', color: 'var(--text2)',
              whiteSpace: 'pre-wrap',
            }}>
              {dish.recipe
                .replace(/##\s*/g, '')
                .replace(/\*\*([^*]+)\*\*/g, '$1')
                .trim()}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function MetaBadge({ icon, text }) {
  return (
    <span style={{
      background: 'var(--bg3)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-sm)', padding: '.3rem .7rem',
      fontSize: '.82rem', color: 'var(--text2)', display: 'flex', alignItems: 'center', gap: '.3rem',
    }}>
      {icon} {text}
    </span>
  )
}

function mealLabel(mt) {
  return { breakfast: '🌅 Завтрак', lunch: '☀️ Обед', dinner: '🌙 Ужин', snack: '🍎 Перекус' }[mt] || mt
}
