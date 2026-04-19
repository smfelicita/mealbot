const VISIBILITY_LABEL = {
  PUBLIC:     null,
  PRIVATE:    { icon: '🔒', label: 'Только я' },
  FAMILY:     { icon: '👨‍👩‍👧', label: 'Семья' },
  ALL_GROUPS: { icon: '👥', label: 'Мои группы' },
}

export default function DishMeta({ dish }) {
  const vis = VISIBILITY_LABEL[dish.visibility] ?? null

  if (!dish.cookTime && !vis) return null

  return (
    <div className="px-4 pt-4 pb-1 flex flex-col gap-1">
      {dish.cookTime && (
        <p className="text-sm text-text-2">
          Время приготовления: <span className="font-medium text-text">{dish.cookTime} мин</span>
        </p>
      )}
      {vis && (
        <p className="text-sm text-text-2">
          Доступ: <span className="font-medium text-text">{vis.icon} {vis.label}</span>
        </p>
      )}
    </div>
  )
}
