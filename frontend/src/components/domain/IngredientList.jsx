import { useState } from 'react'
import { useStore } from '../../store'

const IcoFridge = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <rect x="6" y="3" width="12" height="18" rx="2"/>
    <line x1="6" y1="10" x2="18" y2="10"/>
    <circle cx="10" cy="7" r="1.2" fill="currentColor" stroke="none"/>
    <circle cx="10" cy="15" r="1.2" fill="currentColor" stroke="none"/>
  </svg>
)

export default function IngredientList({ ingredients }) {
  const [visible, setVisible] = useState(true)
  const [fridgeMode, setFridgeMode] = useState(false)

  const fridge = useStore(s => s.fridge)
  const token  = useStore(s => s.token)

  const fridgeIds = new Set(fridge.map(f => f.ingredientId))
  const showFridgeToggle = Boolean(token && fridge.length > 0)

  if (!ingredients?.length) return null

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[17px] font-semibold text-text">Ингредиенты</h2>
        <div className="flex items-center gap-3">
          {showFridgeToggle && (
            <button
              type="button"
              onClick={() => setFridgeMode(v => !v)}
              className={[
                'flex items-center justify-center w-7 h-7 rounded-lg transition-colors focus:outline-none',
                fridgeMode ? 'bg-sage text-white' : 'text-text-3',
              ].join(' ')}
              title="Сравнить с холодильником"
            >
              <IcoFridge />
            </button>
          )}
          <button
            type="button"
            onClick={() => setVisible(v => !v)}
            className="text-[13px] text-text-3 focus:outline-none"
          >
            {visible ? 'Скрыть' : 'Показать'}
          </button>
        </div>
      </div>

      {/* Rows */}
      {visible && (
        <div className="flex flex-col divide-y divide-border">
          {ingredients.map(ing => {
            const amountStr = ing.toTaste
              ? 'по вкусу'
              : ing.amountValue && ing.unit
                ? `${ing.amountValue} ${ing.unit}`
                : ing.amount || null

            const inFridge  = fridgeIds.has(ing.ingredientId ?? ing.id)
            const isNeutral = ing.toTaste || ing.isBasic

            let rowClass = 'flex items-center justify-between py-3'
            if (fridgeMode && !isNeutral) {
              rowClass += inFridge ? ' bg-sage/10 -mx-1 px-1 rounded-lg' : ' bg-red-50 -mx-1 px-1 rounded-lg'
            }

            return (
              <div key={ing.id} className={rowClass}>
                <span className={[
                  'text-[15px] leading-snug',
                  fridgeMode && !isNeutral ? (inFridge ? 'text-sage font-medium' : 'text-red-500') : 'text-text',
                ].join(' ')}>
                  {ing.name}
                  {ing.optional && (
                    <span className="text-text-3 text-xs ml-1.5">необязательно</span>
                  )}
                </span>
                {amountStr && (
                  <span className="text-sm text-text-2 shrink-0 ml-4 tabular-nums">{amountStr}</span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
