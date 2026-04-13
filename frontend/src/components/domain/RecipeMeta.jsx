import { CAT_EMOJI, CAT_RU } from './dishCategories'

export default function RecipeMeta({ dish }) {
  const chips = []

  dish.categories?.forEach(cat => {
    if (CAT_RU[cat]) chips.push({ emoji: CAT_EMOJI[cat] || '🍽️', label: CAT_RU[cat] })
  })
  if (dish.cuisine)  chips.push({ emoji: '🌍', label: dish.cuisine })
  if (dish.cookTime) chips.push({ emoji: '⏱', label: `${dish.cookTime} мин` })

  if (!chips.length) return null

  return (
    <div className="flex flex-wrap gap-2 px-4 py-4">
      {chips.map((c, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[13px] font-medium bg-white text-text-2 border border-border/60"
        >
          {c.label}
        </span>
      ))}
    </div>
  )
}
