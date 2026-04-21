// StatusBadge — мелкий бейдж со смыслом.
// Variants: pro (gold), family (sage), pinned (accent), neutral (бежевый).
// Inline-flex, uppercase, tracking-wide.

const variants = {
  pro:     'bg-pro-muted text-pro border border-pro-border',
  family:  'bg-sage-muted text-sage border border-sage-border',
  pinned:  'bg-accent-muted text-accent border border-accent-border',
  neutral: 'bg-bg-3 text-text-2 border border-border',
}

export default function StatusBadge({
  children,
  variant = 'neutral',
  icon,
  className = '',
}) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5',
        'text-[10.5px] font-bold uppercase tracking-wide',
        variants[variant] || variants.neutral,
        className,
      ].join(' ')}
    >
      {icon}
      {children}
    </span>
  )
}
