import SectionTitle from '../ui/SectionTitle'

export default function IngredientList({ ingredients }) {
  if (!ingredients?.length) return null

  return (
    <div className="mb-6">
      <SectionTitle>🛒 Ингредиенты</SectionTitle>
      <div className="flex flex-wrap gap-2">
        {ingredients.map(ing => {
          const amountStr = ing.toTaste
            ? 'по вкусу'
            : ing.amountValue && ing.unit
              ? `${ing.amountValue} ${ing.unit}`
              : ing.amount || null

          return (
            <div
              key={ing.id}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-3 border border-border rounded-full text-sm font-semibold"
            >
              {ing.emoji && <span>{ing.emoji}</span>}
              <span>{ing.name}</span>
              {amountStr && (
                <span className="text-text-2 font-normal"> — {amountStr}</span>
              )}
              {ing.optional && (
                <span className="text-text-3 text-[11px]"> (опц.)</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
