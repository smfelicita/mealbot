import React from 'react'

const DIFFICULTY = { easy: '🟢 Просто', medium: '🟡 Средне', hard: '🔴 Сложно' }

export default function DishCard({ dish, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', textAlign: 'left', background: 'var(--card)',
      border: '1px solid var(--border)', borderRadius: 'var(--radius)',
      padding: '1rem', cursor: 'pointer',
      transition: 'border-color .15s, transform .15s',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(249,115,22,.4)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: '.3rem' }}>
            {dish.name}
          </div>
          {dish.description && (
            <div style={{
              color: 'var(--text2)', fontSize: '.85rem',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {dish.description}
            </div>
          )}
        </div>
        <span style={{ fontSize: '1.6rem', flexShrink: 0 }}>
          {categoryEmoji(dish.category)}
        </span>
      </div>

      {/* Meta row */}
      <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginTop: '.75rem' }}>
        {dish.cookTime && (
          <Meta icon="⏱️" text={`${dish.cookTime} мин`} />
        )}
        {dish.calories && (
          <Meta icon="🔥" text={`${dish.calories} ккал`} />
        )}
        {dish.difficulty && (
          <Meta text={DIFFICULTY[dish.difficulty] || dish.difficulty} />
        )}
      </div>

      {/* Tags */}
      {dish.tags?.length > 0 && (
        <div style={{ display: 'flex', gap: '.3rem', flexWrap: 'wrap', marginTop: '.6rem' }}>
          {dish.tags.slice(0, 4).map(tag => (
            <span key={tag} style={{
              fontSize: '.72rem', padding: '.15rem .55rem', borderRadius: '999px',
              background: 'var(--bg3)', color: 'var(--text2)', fontWeight: 700,
            }}>
              {tag}
            </span>
          ))}
        </div>
      )}
    </button>
  )
}

function Meta({ icon, text }) {
  return (
    <span style={{
      fontSize: '.8rem', color: 'var(--text2)', display: 'flex', alignItems: 'center', gap: '3px',
    }}>
      {icon} {text}
    </span>
  )
}

function categoryEmoji(cat) {
  const map = {
    BREAKFAST: '🍳', LUNCH: '🍱', DINNER: '🌙',
    SOUP: '🍲', SALAD: '🥗', DESSERT: '🍰',
    SNACK: '🥨', DRINK: '🥤',
  }
  return map[cat] || '🍽️'
}
