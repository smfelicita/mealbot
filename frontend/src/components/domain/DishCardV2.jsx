// DishCardV2 — карточка блюда для списков в редизайне (вариант row).
// Портировано из context/design/home-v2.jsx (функция DishRow).
//
// Layout:
//   [фото 64×64 с fridge-check ✓] [название + мета (Clock, тип приёма, docs missing)] [Heart, Plus вертикально]
//
// Props:
//   - dish: { id, name, cookTime, images?, imageUrl?, mealTime?, ingredients? }
//   - onClick: открыть детальную
//   - isFav: boolean
//   - onToggleFav: (dishId) => void
//   - fridgeIngredientIds: Set<string>  — если передан, считаем missingCount и allInFridge
//   - onAddToPlan: (dish) => void

import { Clock, Heart, Plus, Check, Utensils, Sun, Moon, Cookie } from 'lucide-react'
import { useStore } from '../../store'

const SUPABASE_IMG = 'https://nwtqeytmmqmkwqafkgin.supabase.co/storage/v1/object/public/media/images'

const MEAL_LABEL = {
  BREAKFAST: 'Завтрак',
  LUNCH:     'Обед',
  DINNER:    'Ужин',
  SNACK:     'Перекус',
}

function getImg(dish) {
  const cat = dish.categories?.[0] ?? dish.category
  const uploaded = dish.images?.[0] || dish.imageUrl
  return uploaded || (cat ? `${SUPABASE_IMG}/${cat.toLowerCase()}.jpg` : null)
}

export default function DishCardV2({
  dish,
  onClick,
  isFav = false,
  onToggleFav,
  fridgeIngredientIds,
  onAddToPlan,
  className = '',
}) {
  const planDishIds   = useStore(s => s.planDishIds)
  const addPlanDishId = useStore(s => s.addPlanDishId)
  const isInPlan      = planDishIds.has(dish.id)

  const img = getImg(dish)
  const missing = fridgeIngredientIds && dish.ingredients?.length > 0
    ? dish.ingredients.filter(i => !i.toTaste && !i.isBasic && !fridgeIngredientIds.has(i.id))
    : null
  const allInFridge = missing !== null && missing.length === 0
  const mealLabel = MEAL_LABEL[dish.mealTime?.[0]]

  function handleCardClick() {
    onClick?.(dish)
  }

  function handleFav(e) {
    e.stopPropagation()
    onToggleFav?.(dish.id)
  }

  function handleAdd(e) {
    e.stopPropagation()
    if (isInPlan) return
    onAddToPlan?.(dish)
    addPlanDishId(dish.id)
  }

  return (
    <div
      className={[
        'rounded-2xl bg-bg-2 border border-border p-2.5 flex items-center gap-3',
        'transition-colors',
        className,
      ].join(' ')}
    >
      {/* Фото + fridge-check */}
      <button
        type="button"
        onClick={handleCardClick}
        className="relative flex-shrink-0 focus:outline-none"
        aria-label={`Открыть ${dish.name}`}
      >
        <div className="w-16 h-16 rounded-xl overflow-hidden border border-border bg-bg-3 flex items-center justify-center">
          {img
            ? <img src={img} alt="" className="w-full h-full object-cover" />
            : <Utensils size={20} className="text-text-3" />
          }
        </div>
        {allInFridge && (
          <div
            className="absolute -top-1 -right-1 w-[18px] h-[18px] rounded-full bg-sage flex items-center justify-center"
            style={{ border: '2px solid #fff' }}
            aria-label="Всё есть в холодильнике"
          >
            <Check size={10} strokeWidth={3} color="#fff" />
          </div>
        )}
      </button>

      {/* Название + мета */}
      <button
        type="button"
        onClick={handleCardClick}
        className="flex-1 min-w-0 text-left focus:outline-none"
      >
        <div
          className="text-[14px] font-bold leading-tight text-text"
          style={{ textWrap: 'pretty' }}
        >
          {dish.name}
        </div>
        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
          {dish.cookTime && (
            <span className="flex items-center gap-0.5 text-[11.5px] text-text-2">
              <Clock size={10} strokeWidth={2.2} />
              {dish.cookTime} мин
            </span>
          )}
          {mealLabel && (
            <span className="text-[10.5px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-bg-3 text-text-2">
              {mealLabel}
            </span>
          )}
          {missing !== null && missing.length > 0 && (
            <span className="text-[11px] font-bold text-accent">
              · докупить {missing.length}
            </span>
          )}
        </div>
      </button>

      {/* Heart + Plus */}
      <div className="flex flex-col gap-1.5 items-center flex-shrink-0">
        {onToggleFav && (
          <button
            type="button"
            onClick={handleFav}
            className={[
              'w-8 h-8 rounded-full flex items-center justify-center border transition-colors',
              isFav
                ? 'bg-accent border-accent text-white'
                : 'bg-bg-3 border-border text-text-2 hover:text-accent hover:border-accent',
            ].join(' ')}
            aria-label={isFav ? 'Убрать из избранного' : 'В избранное'}
          >
            <Heart
              size={14}
              strokeWidth={2.2}
              fill={isFav ? '#fff' : 'none'}
            />
          </button>
        )}
        {onAddToPlan && (
          <button
            type="button"
            onClick={handleAdd}
            className={[
              'w-8 h-8 rounded-full flex items-center justify-center border transition-colors',
              isInPlan
                ? 'bg-sage-muted border-sage-border text-sage'
                : 'bg-bg-3 border-border text-text-2 hover:text-accent hover:border-accent',
            ].join(' ')}
            aria-label={isInPlan ? 'Уже в плане' : 'Добавить в план'}
          >
            {isInPlan
              ? <Check size={14} strokeWidth={2.6} />
              : <Plus  size={14} strokeWidth={2.4} />
            }
          </button>
        )}
      </div>
    </div>
  )
}
