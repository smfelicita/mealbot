// HintBanner — однократный hint, закрывается крестиком.
// Использует useHintDismiss(storageKey) для запоминания состояния.
// Если storageKey не передан — баннер нельзя закрыть (постоянный).
//
// Props:
//   - storageKey: string (ключ в localStorage, напр. 'mealbot_hint_fridge_seen')
//   - icon?: ReactNode (lucide-иконка 16-18px)
//   - title?: string
//   - children: основной текст
//   - variant?: 'neutral' | 'accent' | 'sage' | 'pro'
//   - dismissible?: boolean (default: true если есть storageKey)

import { X } from 'lucide-react'
import { useHintDismiss } from '../../hooks/useHintDismiss'

const variants = {
  neutral: 'bg-bg-2 border-border text-text',
  accent:  'bg-accent-muted border-accent-border text-text',
  sage:    'bg-sage-muted border-sage-border text-text',
  pro:     'bg-pro-muted border-pro-border text-text',
}

const iconColorMap = {
  neutral: 'text-text-2',
  accent:  'text-accent',
  sage:    'text-sage',
  pro:     'text-pro',
}

export default function HintBanner({
  storageKey,
  icon,
  title,
  children,
  variant = 'neutral',
  dismissible,
  className = '',
}) {
  // Если storageKey не передан — используем пустой ключ (хук всё равно будет работать, но просто не запомнит)
  // Но правильнее всегда давать ключ. Если нет — dismissible = false.
  const [dismissed, dismiss] = useHintDismiss(storageKey || '__no_key__')
  const canDismiss = dismissible ?? !!storageKey

  if (storageKey && dismissed) return null

  return (
    <div
      className={[
        'rounded-2xl border px-4 py-3 flex items-start gap-3',
        variants[variant] || variants.neutral,
        className,
      ].join(' ')}
    >
      {icon && (
        <div className={['shrink-0 mt-0.5', iconColorMap[variant] || iconColorMap.neutral].join(' ')}>
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        {title && (
          <div className="text-[14px] font-bold text-text leading-tight mb-1">
            {title}
          </div>
        )}
        <div className="text-[13px] text-text-2 leading-snug" style={{ textWrap: 'pretty' }}>
          {children}
        </div>
      </div>
      {canDismiss && (
        <button
          type="button"
          onClick={dismiss}
          aria-label="Закрыть"
          className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-text-3 hover:text-text hover:bg-bg-3 transition-colors"
        >
          <X size={16} strokeWidth={2.2} />
        </button>
      )}
    </div>
  )
}
