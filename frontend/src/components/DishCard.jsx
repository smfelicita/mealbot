const DIFFICULTY = { easy: '🟢 Просто', medium: '🟡 Средне', hard: '🔴 Сложно' }

// Подсвечивает совпадение в тексте
function Highlight({ text, query }) {
  if (!query || !text) return text
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: 'rgba(249,115,22,.3)', color: 'inherit', borderRadius: 2, padding: '0 1px' }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  )
}

export default function DishCard({ dish, onClick, searchQuery }) {
  const primaryCategory = dish.categories?.[0] ?? dish.category

  // Определяем что совпало с поиском
  let matchHint = null
  if (searchQuery) {
    const q = searchQuery.toLowerCase()
    const nameMatches = dish.name?.toLowerCase().includes(q)
    const descMatches = dish.description?.toLowerCase().includes(q)
    if (!nameMatches && !descMatches) {
      const matchedTag = dish.tags?.find(t => t.toLowerCase().includes(q))
      const matchedIng = dish.ingredients?.find(i => i.name?.toLowerCase().includes(q))
      if (matchedIng) matchHint = `по ингредиенту: ${matchedIng.name}`
      else if (matchedTag) matchHint = `по тегу: ${matchedTag}`
    }
  }

  return (
    <button onClick={onClick} style={{
      width: '100%', textAlign: 'left', background: 'var(--card)',
      border: '1px solid var(--border)', borderRadius: 'var(--radius)',
      overflow: 'hidden', cursor: 'pointer', padding: 0,
      transition: 'border-color .15s, transform .15s',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(249,115,22,.4)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      {/* Фото или плейсхолдер */}
      {dish.imageUrl ? (
        <div style={{ position: 'relative', height: 130, overflow: 'hidden' }}>
          <img src={dish.imageUrl} alt={dish.name} style={{
            width: '100%', height: '100%', objectFit: 'cover', display: 'block',
          }} />
          <div style={{
            position: 'absolute', top: 8, right: 8,
            background: 'rgba(0,0,0,.55)', borderRadius: 8,
            padding: '3px 8px', fontSize: 13, fontWeight: 700,
          }}>
            {categoryEmoji(primaryCategory)}
          </div>
        </div>
      ) : (
        <div style={{
          height: 52, background: 'var(--bg3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
        }}>
          {categoryEmoji(primaryCategory)}
        </div>
      )}

      <div style={{ padding: '12px 14px 14px' }}>
        <div style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: '.25rem', lineHeight: 1.2 }}>
          <Highlight text={dish.name} query={searchQuery} />
        </div>
        {dish.description && (
          <div style={{
            color: 'var(--text2)', fontSize: '.85rem', marginBottom: '.6rem',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            <Highlight text={dish.description} query={searchQuery} />
          </div>
        )}

        {matchHint && (
          <div style={{ fontSize: '.75rem', color: 'var(--accent)', marginBottom: '.5rem', fontWeight: 600 }}>
            🔍 {matchHint}
          </div>
        )}

        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
          {dish.cookTime && <Meta icon="⏱️" text={`${dish.cookTime} мин`} />}
          {dish.calories && <Meta icon="🔥" text={`${dish.calories} ккал`} />}
          {dish.difficulty && <Meta text={DIFFICULTY[dish.difficulty] || dish.difficulty} />}
          {dish.cuisine && <Meta text={dish.cuisine} color="var(--teal)" />}
        </div>

        {dish.tags?.length > 0 && (
          <div style={{ display: 'flex', gap: '.3rem', flexWrap: 'wrap', marginTop: '.6rem' }}>
            {dish.tags.slice(0, 3).map(tag => (
              <span key={tag} style={{
                fontSize: '.72rem', padding: '.15rem .55rem', borderRadius: '999px',
                background: searchQuery && tag.toLowerCase().includes(searchQuery.toLowerCase())
                  ? 'rgba(249,115,22,.2)' : 'var(--bg3)',
                color: searchQuery && tag.toLowerCase().includes(searchQuery.toLowerCase())
                  ? 'var(--accent)' : 'var(--text2)',
                fontWeight: 700,
              }}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  )
}

function Meta({ icon, text, color }) {
  return (
    <span style={{ fontSize: '.8rem', color: color || 'var(--text2)', display: 'flex', alignItems: 'center', gap: '3px' }}>
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
