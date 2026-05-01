// MetaStrip — горизонтальная карточка с 2–4 метриками.
// Каждая метрика: иконка + value + unit (опционально) + label.
// items: [{ icon?: ReactNode, value, unit?, label, accent?: 'accent' | 'sage' | 'pro' }]
// Иконка — лучше из lucide-react, 16-17px. Если не передана — просто число + label.

const accentMap = {
  accent: 'text-accent',
  sage:   'text-sage',
  pro:    'text-pro',
}

export default function MetaStrip({ items = [], className = '' }) {
  return (
    <div
      className={[
        'bg-bg-2 border border-border rounded-2xl',
        'flex items-stretch justify-between',
        'px-2 py-3',
        className,
      ].join(' ')}
    >
      {items.map((item, i) => (
        <div key={i} className="flex-1 flex items-stretch">
          <MetaCell item={item} />
          {i < items.length - 1 && (
            <div className="w-px bg-border my-1 self-stretch" aria-hidden />
          )}
        </div>
      ))}
    </div>
  )
}

function MetaCell({ item }) {
  const { icon, value, unit, label, accent = 'accent' } = item
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-0.5 px-1.5">
      {icon && (
        <div className={['mb-0.5', accentMap[accent] || accentMap.accent].join(' ')}>
          {icon}
        </div>
      )}
      <div className="text-[17px] font-extrabold tabular-nums text-text leading-none">
        {value}
        {unit && (
          <span className="text-[11px] font-semibold text-text-3 ml-0.5">
            {unit}
          </span>
        )}
      </div>
      {label && (
        <div className="text-[10.5px] font-semibold uppercase tracking-wide text-text-3 text-center mt-0.5">
          {label}
        </div>
      )}
    </div>
  )
}
