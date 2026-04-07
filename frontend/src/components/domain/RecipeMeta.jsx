const CAT_EMOJI = {
  BREAKFAST: '🍳', LUNCH: '🍱', DINNER: '🌙',
  SOUP: '🍲', SALAD: '🥗', SNACK: '🥨',
  DESSERT: '🍰', DRINK: '🥤',
}
const CAT_RU = {
  BREAKFAST: 'Завтрак', LUNCH: 'Обед', DINNER: 'Ужин',
  SOUP: 'Суп', SALAD: 'Салат', SNACK: 'Перекус',
  DESSERT: 'Десерт', DRINK: 'Напиток',
}

export default function RecipeMeta({ dish }) {
  const chips = []

  dish.categories?.forEach(cat => {
    if (CAT_RU[cat]) chips.push({ emoji: CAT_EMOJI[cat] || '🍽️', label: CAT_RU[cat] })
  })
  if (dish.cuisine)  chips.push({ emoji: '🌍', label: dish.cuisine })
  if (dish.cookTime) chips.push({ emoji: '⏱', label: `${dish.cookTime} мин` })

  if (!chips.length) return null

  return (
    <div className="flex flex-wrap gap-2 px-4 py-3">
      {chips.map((c, i) => (
        <span
          key={i}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium bg-white text-text-2"
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
        >
          <span>{c.emoji}</span>
          {c.label}
        </span>
      ))}
    </div>
  )
}
