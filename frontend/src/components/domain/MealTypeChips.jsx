const ALL_OPTION = { value: '', label: 'Все' }

const MEAL_TIMES = [
  { value: 'breakfast', label: 'Завтрак' },
  { value: 'lunch',     label: 'Обед'    },
  { value: 'dinner',    label: 'Ужин'    },
  { value: 'snack',     label: 'Перекус' },
]

export default function MealTypeChips({ active, onChange, multi = false, showAll = false }) {
  const options = showAll ? [ALL_OPTION, ...MEAL_TIMES] : MEAL_TIMES

  function handleClick(value) {
    if (multi) {
      const current = active || []
      onChange(current.includes(value) ? current.filter(v => v !== value) : [...current, value])
    } else {
      onChange(active === value ? '' : value)
    }
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
      {options.map(mt => {
        const isActive = multi
          ? (active || []).includes(mt.value)
          : active === mt.value || (mt.value === '' && !active)

        return (
          <button
            key={mt.value}
            type="button"
            onClick={() => handleClick(mt.value)}
            className={[
              'shrink-0 px-4 py-1.5 rounded-xl text-[13px] font-medium transition-all',
              'focus:outline-none whitespace-nowrap border',
              isActive
                ? 'text-white border-transparent'
                : 'bg-white text-text-2 border-border/60',
            ].join(' ')}
            style={isActive ? { background: '#5C7A59' } : {}}
          >
            {mt.label}
          </button>
        )
      })}
    </div>
  )
}
