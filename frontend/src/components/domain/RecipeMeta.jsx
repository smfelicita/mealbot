const CAT_EMOJI = {
  BREAKFAST: '🌅', LUNCH: '☀️', DINNER: '🌙',
  SOUP: '🍲', SALAD: '🥗', SNACK: '🍎',
  DESSERT: '🍰', DRINK: '🥤',
}
const CAT_RU = {
  BREAKFAST: 'Завтрак', LUNCH: 'Обед', DINNER: 'Ужин',
  SOUP: 'Суп', SALAD: 'Салат', SNACK: 'Перекус',
  DESSERT: 'Десерт', DRINK: 'Напиток',
}
const DIFF = { easy: 'Просто', medium: 'Средне', hard: 'Сложно' }
const DIFF_CLS = { easy: 'text-teal', medium: 'text-accent-2', hard: 'text-red-400' }

export default function RecipeMeta({ dish }) {
  return (
    <div className="flex flex-wrap gap-2 px-4 py-3">
      {dish.categories?.map(cat => (
        <span key={cat} className="flex items-center gap-1 bg-bg-3 border border-border rounded-full px-2.5 py-1 text-xs text-text-2 font-bold">
          {CAT_EMOJI[cat]} {CAT_RU[cat] || cat}
        </span>
      ))}
      {dish.cuisine && (
        <span className="flex items-center gap-1 bg-teal/10 border border-teal rounded-full px-2.5 py-1 text-xs text-teal font-bold">
          🌍 {dish.cuisine}
        </span>
      )}
      {dish.cookTime && (
        <span className="flex flex-col items-center bg-bg-3 border border-border rounded-sm px-3 py-1.5 text-center">
          <span className="text-base">⏱</span>
          <span className="text-[11px] text-text-2 mt-0.5">{dish.cookTime} мин</span>
        </span>
      )}
      {dish.calories && (
        <span className="flex flex-col items-center bg-bg-3 border border-border rounded-sm px-3 py-1.5 text-center">
          <span className="text-base">🔥</span>
          <span className="text-[11px] text-text-2 mt-0.5">{dish.calories} ккал</span>
        </span>
      )}
      {dish.difficulty && (
        <span className="flex flex-col items-center bg-bg-3 border border-border rounded-sm px-3 py-1.5 text-center">
          <span className="text-base">👨‍🍳</span>
          <span className={`text-[11px] mt-0.5 font-bold ${DIFF_CLS[dish.difficulty]}`}>
            {DIFF[dish.difficulty]}
          </span>
        </span>
      )}
    </div>
  )
}
