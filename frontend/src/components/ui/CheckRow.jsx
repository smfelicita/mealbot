// CheckRow — строка с кастомным чек-боксом.
// Используется для списков ингредиентов, пикера холодильника, чек-листов.
//
// Props:
//   - checked: boolean
//   - onChange: (next: boolean) => void
//   - label: string | ReactNode  (основной текст)
//   - meta?: string | ReactNode  (мета справа: "200 г", "есть в холодильнике")
//   - sublabel?: string          (подпись под label)
//   - icon?: ReactNode           (слева перед label, опционально)
//   - disabled?: boolean
//   - variant?: 'default' | 'sage' | 'accent'  — цвет активного чекбокса

import { Check } from 'lucide-react'

const variantMap = {
  default: { bg: 'bg-accent', border: 'border-accent' },
  accent:  { bg: 'bg-accent', border: 'border-accent' },
  sage:    { bg: 'bg-sage',   border: 'border-sage'   },
}

export default function CheckRow({
  checked = false,
  onChange,
  label,
  meta,
  sublabel,
  icon,
  disabled = false,
  variant = 'default',
  className = '',
}) {
  const v = variantMap[variant] || variantMap.default

  const toggle = () => {
    if (disabled) return
    onChange?.(!checked)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={disabled}
      className={[
        'w-full flex items-center gap-3 py-2.5 px-1',
        'text-left transition-colors duration-150',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-bg-3/40 rounded-lg',
        className,
      ].join(' ')}
    >
      {/* Checkbox */}
      <span
        aria-hidden
        className={[
          'shrink-0 w-5 h-5 rounded-md border flex items-center justify-center',
          'transition-all duration-150',
          checked
            ? `${v.bg} ${v.border} text-white`
            : 'bg-bg-2 border-border text-transparent',
        ].join(' ')}
      >
        {checked && <Check size={14} strokeWidth={3} />}
      </span>

      {/* Optional icon */}
      {icon && (
        <span className="shrink-0 text-text-3">{icon}</span>
      )}

      {/* Label + sublabel */}
      <span className="flex-1 min-w-0">
        <span
          className={[
            'block text-[14px] leading-tight',
            checked ? 'text-text font-semibold' : 'text-text',
          ].join(' ')}
        >
          {label}
        </span>
        {sublabel && (
          <span className="block text-[12px] text-text-3 mt-0.5">{sublabel}</span>
        )}
      </span>

      {/* Meta справа */}
      {meta && (
        <span className="shrink-0 text-[12px] text-text-2 font-semibold tabular-nums">
          {meta}
        </span>
      )}
    </button>
  )
}
