const variants = {
  primary:   'bg-accent text-white hover:bg-accent-2 active:opacity-90',
  secondary: 'bg-bg-3 text-text border border-border hover:border-accent hover:text-accent',
  ghost:     'bg-transparent text-text-2 hover:text-text',
  danger:    'bg-transparent text-red-400 hover:text-red-500',
}

const sizes = {
  sm: 'px-3.5 py-1.5 text-xs min-h-[36px]',
  md: 'px-5 py-2.5 text-sm min-h-[44px]',
  lg: 'px-6 py-3 text-base min-h-[52px]',
  icon: 'p-2 min-w-[40px] min-h-[40px]',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  type = 'button',
  onClick,
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={[
        'inline-flex items-center justify-center gap-1.5 rounded-sm font-bold',
        'transition-all duration-150 cursor-pointer',
        'focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1',
        'disabled:opacity-40 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className,
      ].join(' ')}
    >
      {loading ? <Spinner /> : children}
    </button>
  )
}

function Spinner() {
  return (
    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
  )
}
