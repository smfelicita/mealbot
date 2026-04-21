// Button — единственная кнопка в системе.
// Все кнопки pill (rounded-full).
// Variants: primary, secondary, ghost, success, destructive, pro.
// Sizes: sm (h-9), md (h-11, default), lg (h-12), icon (квадрат 40x40).

const variants = {
  primary:
    'bg-accent text-white hover:bg-accent-2 active:opacity-90',
  secondary:
    'bg-bg-2 text-text border border-border hover:border-accent hover:text-accent',
  ghost:
    'bg-transparent text-text-2 hover:text-text',
  success:
    'bg-sage text-white hover:opacity-90',
  destructive:
    'bg-transparent text-red-500 border border-red-300 hover:bg-red-50',
  pro:
    'bg-pro text-white hover:opacity-90',
}

const sizes = {
  sm:   'h-9 px-4 text-[13px]',
  md:   'h-11 px-5 text-[15px]',
  lg:   'h-12 px-6 text-[15px]',
  icon: 'w-10 h-10 p-0',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  className = '',
  type = 'button',
  onClick,
  ...rest
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-full font-bold',
        'transition-all duration-150 cursor-pointer',
        'focus:outline-none focus:ring-2 focus:ring-accent/40 focus:ring-offset-2 focus:ring-offset-bg',
        'disabled:opacity-40 disabled:pointer-events-none',
        fullWidth ? 'w-full' : '',
        variants[variant],
        sizes[size],
        className,
      ].join(' ')}
      {...rest}
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
