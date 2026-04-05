const sizes = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
}

export default function Avatar({ name, src, size = 'md', className = '' }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizes[size]} rounded-full object-cover shrink-0 ${className}`}
      />
    )
  }

  const initial = name?.[0]?.toUpperCase() || '👤'

  return (
    <div className={[
      sizes[size],
      'rounded-full bg-accent text-white font-extrabold',
      'flex items-center justify-center shrink-0',
      className,
    ].join(' ')}>
      {initial}
    </div>
  )
}
