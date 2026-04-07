import { useState } from 'react'

const COLLAPSED_COUNT = 5

const IcoChevron = ({ open }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d={open ? 'M18 15l-6-6-6 6' : 'M6 9l6 6 6-6'} />
  </svg>
)

export default function IngredientList({ ingredients }) {
  const [expanded, setExpanded] = useState(false)

  if (!ingredients?.length) return null

  const hasMore   = ingredients.length > COLLAPSED_COUNT
  const visible   = expanded || !hasMore ? ingredients : ingredients.slice(0, COLLAPSED_COUNT)
  const hiddenCnt = ingredients.length - COLLAPSED_COUNT

  return (
    <div className="mb-6">
      {/* Header — кликабельный если есть скрытые */}
      {hasMore ? (
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          className="flex items-center gap-2 w-full text-left mb-3 focus:outline-none"
        >
          <h2 className="font-semibold text-[16px] text-text flex-1">🛒 Ингредиенты</h2>
          <span className="text-[13px] text-text-3">{ingredients.length} шт.</span>
          <span className="flex items-center gap-1 text-[13px] text-text-3">
            {expanded ? 'Скрыть' : 'Показать все'}
            <IcoChevron open={expanded} />
          </span>
        </button>
      ) : (
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-[16px] text-text">🛒 Ингредиенты</h2>
          <span className="text-[13px] text-text-3">{ingredients.length} шт.</span>
        </div>
      )}

      {/* List */}
      <div className="flex flex-col">
        {visible.map((ing, idx) => {
          const amountStr = ing.toTaste
            ? 'по вкусу'
            : ing.amountValue && ing.unit
              ? `${ing.amountValue} ${ing.unit}`
              : ing.amount || null

          return (
            <div
              key={ing.id}
              className={[
                'flex items-center justify-between py-2.5',
                idx < visible.length - 1 ? 'border-b border-border' : '',
              ].join(' ')}
            >
              <span className="text-[14px] text-text">
                {ing.name}
                {ing.optional && (
                  <span className="text-text-3 text-[12px] ml-1">(необязательно)</span>
                )}
              </span>
              {amountStr && (
                <span className="text-[13px] text-text-2 shrink-0 ml-3">{amountStr}</span>
              )}
            </div>
          )
        })}
      </div>

    </div>
  )
}
