import Chip from '../ui/Chip'
import Button from '../ui/Button'

const CATEGORIES = [
  { value: 'BREAKFAST', label: '🍳 Завтрак' },
  { value: 'LUNCH',     label: '🍱 Обед'    },
  { value: 'DINNER',    label: '🌙 Ужин'    },
  { value: 'SNACK',     label: '🥨 Перекус' },
  { value: 'SOUP',      label: '🍲 Суп'     },
  { value: 'SALAD',     label: '🥗 Салат'   },
  { value: 'DESSERT',   label: '🍰 Десерт'  },
  { value: 'DRINK',     label: '🥤 Напиток' },
]

const TAGS = ['быстро', 'вегетарианское', 'здоровое', 'сытное', 'без глютена', 'традиционное']

export default function FilterPanel({ category, onCategory, activeTags, onTags, onReset }) {
  const hasFilters = category || activeTags.length > 0

  function toggleTag(tag) {
    onTags(
      activeTags.includes(tag)
        ? activeTags.filter(t => t !== tag)
        : [...activeTags, tag]
    )
  }

  return (
    <div className="bg-card border border-border rounded-md p-4 mb-3.5 flex flex-col gap-4">
      {/* Категория */}
      <div>
        <p className="text-xs font-bold text-text-2 uppercase tracking-widest mb-2">Категория</p>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map(c => (
            <Chip
              key={c.value}
              active={category === c.value}
              onClick={() => onCategory(category === c.value ? '' : c.value)}
            >
              {c.label}
            </Chip>
          ))}
        </div>
      </div>

      {/* Теги */}
      <div>
        <p className="text-xs font-bold text-text-2 uppercase tracking-widest mb-2">Теги</p>
        <div className="flex flex-wrap gap-1.5">
          {TAGS.map(tag => (
            <Chip
              key={tag}
              active={activeTags.includes(tag)}
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </Chip>
          ))}
        </div>
      </div>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={onReset} className="self-start">
          Сбросить фильтры ✕
        </Button>
      )}
    </div>
  )
}
