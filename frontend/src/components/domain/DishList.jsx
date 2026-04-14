import DishCard from './DishCard'
import Loader from '../ui/Loader'
import EmptyState from '../ui/EmptyState'

export default function DishList({
  dishes,
  loading,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  emptyAction,
  searchQuery,
  isFavSet,
  onToggleFav,
  fridgeIngredientIds,
  onDishClick,
  variant = 'grid',
}) {
  if (loading) {
    return <Loader fullPage />
  }

  if (!dishes?.length) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    )
  }

  return (
    <div className={variant === 'row' ? 'flex flex-col gap-3' : 'grid grid-cols-1 xs:grid-cols-2 gap-3'}>
      {dishes.map((dish, i) => (
        <div
          key={dish.id}
          className="fade-up"
          style={{ animationDelay: `${i * 0.04}s` }}
        >
          <DishCard
            variant={variant}
            dish={dish}
            onClick={() => onDishClick(dish.id)}
            searchQuery={searchQuery}
            isFav={isFavSet?.has(dish.id)}
            onToggleFav={onToggleFav}
            fridgeIngredientIds={fridgeIngredientIds}
          />
        </div>
      ))}
    </div>
  )
}
