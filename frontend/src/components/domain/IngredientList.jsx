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

  return (
    <div className="mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[17px] font-semibold text-text">Ингредиенты</h2>
        {hasMore && (
          <button
            type="button"
            onClick={() => setExpanded(v => !v)}
            className="flex items-center gap-1 text-[13px] text-text-3 focus:outline-none"
          >
            {expanded ? 'Скрыть' : 'Показать все'}
            <IcoChevron open={expanded} />
          </button>
        )}
      </div>

      {/* Rows */}
      <div className="flex flex-col divide-y divide-border">
        {visible.map(ing => {
          const amountStr = ing.toTaste
            ? 'по вкусу'
            : ing.amountValue && ing.unit
              ? `${ing.amountValue} ${ing.unit}`
              : ing.amount || null

          return (
            <div key={ing.id} className="flex items-center justify-between py-3">
              <span className="text-[15px] text-text leading-snug">
                {ing.name}
                {ing.optional && (
                  <span className="text-text-3 text-[12px] ml-1.5">необязательно</span>
                )}
              </span>
              {amountStr && (
                <span className="text-[14px] text-text-2 shrink-0 ml-4 tabular-nums">{amountStr}</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
