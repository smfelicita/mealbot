import Chip from '../ui/Chip'

const MEAL_TIMES = [
  { value: 'breakfast', label: 'Завтрак', icon: '🌅' },
  { value: 'lunch',     label: 'Обед',    icon: '☀️' },
  { value: 'dinner',    label: 'Ужин',    icon: '🌙' },
  { value: 'snack',     label: 'Перекус', icon: '🍎' },
]

export default function MealTypeChips({ active, onChange, multi = false }) {
  function handleClick(value) {
    if (multi) {
      // active — массив
      const current = active || []
      onChange(
        current.includes(value)
          ? current.filter(v => v !== value)
          : [...current, value]
      )
    } else {
      // active — строка, повторный клик снимает
      onChange(active === value ? '' : value)
    }
  }

  return (
    <div className="flex gap-2 flex-wrap">
      {MEAL_TIMES.map(mt => {
        const isActive = multi
          ? (active || []).includes(mt.value)
          : active === mt.value
        return (
          <Chip
            key={mt.value}
            active={isActive}
            onClick={() => handleClick(mt.value)}
          >
            {mt.icon} {mt.label}
          </Chip>
        )
      })}
    </div>
  )
}
