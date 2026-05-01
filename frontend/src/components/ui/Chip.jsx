// Chip — pill-чип с тремя семантиками.
// Variants: primary, neutral, success.
// active=true для primary меняет фон/бордер на accent-muted.
// success — самостоятельный «успех», не требует active.

const variants = {
  primary: {
    active:   'bg-accent-muted border-accent-border text-accent font-bold',
    inactive: 'bg-bg-2 border-border text-text-2 font-semibold',
  },
  neutral: {
    active:   'bg-bg-3 border-border text-text font-bold',
    inactive: 'bg-bg-2 border-border text-text-2 font-semibold',
  },
  success: {
    active:   'bg-sage-muted border-sage-border text-sage font-bold',
    inactive: 'bg-bg-2 border-border text-text-2 font-semibold',
  },
}

const sizes = {
  sm: 'px-2.5 py-1 text-[11px] gap-1',
  md: 'px-3 py-1.5 text-[12.5px] gap-1.5',
  lg: 'px-3.5 py-2 text-[13px] gap-1.5',
}

export default function Chip({
  children,
  variant = 'primary',
  size = 'md',
  active = false,
  onClick,
  className = '',
  ...rest
}) {
  const Tag = onClick ? 'button' : 'span'
  const state = active ? 'active' : 'inactive'

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={[
        'inline-flex items-center rounded-full border transition-all duration-150',
        onClick ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent/30' : '',
        variants[variant][state],
        sizes[size],
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </Tag>
  )
}
