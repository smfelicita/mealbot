// FAB — Floating Action Button.
// С label — pill (h-13 px-5). Без label — круглый (w-13 h-13).
// Position: fixed bottom-20 right-4 (над tab bar 64px + safe area).
// Иконка — любой ReactNode (lucide-react или другое).

export default function FAB({
  icon,
  label,
  onClick,
  className = '',
  position = 'bottom-right', // 'bottom-right' | 'bottom-center'
  ...rest
}) {
  const isRound = !label

  const posClass =
    position === 'bottom-center'
      ? 'left-1/2 -translate-x-1/2 bottom-20'
      : 'right-4 bottom-20'

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'fixed z-30',
        posClass,
        'flex items-center justify-center gap-2',
        'bg-accent text-white font-bold',
        'rounded-full',
        isRound ? 'w-13 h-13' : 'h-13 px-5 text-[14.5px]',
        'transition-all duration-150 active:scale-95',
        'focus:outline-none focus:ring-2 focus:ring-accent/40 focus:ring-offset-2 focus:ring-offset-bg',
        className,
      ].join(' ')}
      style={{ boxShadow: '0 8px 24px rgba(196,112,74,0.45)' }}
      aria-label={label || 'Добавить'}
      {...rest}
    >
      {icon}
      {label && <span>{label}</span>}
    </button>
  )
}
