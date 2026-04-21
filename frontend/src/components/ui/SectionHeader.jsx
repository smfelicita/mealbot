// SectionHeader — заголовок секции внутри страницы.
// title (17px bold) + subtitle (12px text-3) + right slot.

export default function SectionHeader({
  title,
  subtitle,
  right,
  className = '',
}) {
  return (
    <div className={['flex items-end justify-between gap-3 mb-3', className].join(' ')}>
      <div className="min-w-0">
        <h2 className="text-[17px] font-bold tracking-tight text-text leading-tight">
          {title}
        </h2>
        {subtitle && (
          <div className="text-[12px] text-text-3 mt-0.5">{subtitle}</div>
        )}
      </div>
      {right && <div className="flex-shrink-0 pb-0.5">{right}</div>}
    </div>
  )
}
