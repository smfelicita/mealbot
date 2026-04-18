export default function DishMeta({ dish }) {
  if (!dish.cookTime) return null
  return (
    <div className="px-4 pt-4 pb-1">
      <p className="text-sm text-text-2">
        Время приготовления: <span className="font-medium text-text">{dish.cookTime} мин</span>
      </p>
    </div>
  )
}
