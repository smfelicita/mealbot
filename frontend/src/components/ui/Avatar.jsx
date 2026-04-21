// Avatar — инициал или фото. Новый стиль по design-system v2.
// По умолчанию: bg-bg-3 + border-border + text-accent font-bold.
// Pro — обводка золотым ring-2.
// Sizes: sm (26px), md (32px), lg (40px), xl (56px).

const sizes = {
  sm: { box: 'w-[26px] h-[26px]', text: 'text-[11px]' },
  md: { box: 'w-8 h-8',            text: 'text-[13px]' },
  lg: { box: 'w-10 h-10',          text: 'text-[15px]' },
  xl: { box: 'w-14 h-14',          text: 'text-[22px]' },
}

export default function Avatar({
  name,
  initial,
  src,
  size = 'md',
  pro = false,
  className = '',
  ...rest
}) {
  const s = sizes[size] || sizes.md
  const ring = pro ? 'ring-2 ring-pro ring-offset-2 ring-offset-bg' : ''

  if (src) {
    return (
      <img
        src={src}
        alt={name || ''}
        className={[
          s.box,
          'rounded-full object-cover shrink-0 border border-border',
          ring,
          className,
        ].join(' ')}
        {...rest}
      />
    )
  }

  const ch = (initial ?? name?.[0] ?? '').toUpperCase() || '·'

  return (
    <div
      className={[
        s.box, s.text,
        'rounded-full bg-bg-3 border border-border text-accent font-bold',
        'flex items-center justify-center shrink-0',
        ring,
        className,
      ].join(' ')}
      {...rest}
    >
      {ch}
    </div>
  )
}
