// PageHeader — верхняя часть страницы.
// H1 (26px extrabold) + опциональный right-slot (счётчик, кнопка, chip).
// Опциональный subtitle (приветствие, мета).

export default function PageHeader({
  title,
  subtitle,
  right,
  className = '',
}) {
  return (
    <div className={['px-5 pt-4 pb-2', className].join(' ')}>
      {subtitle && (
        <div className="text-[13px] text-text-2 mb-1">{subtitle}</div>
      )}
      <div className="flex items-end justify-between gap-3">
        <h1
          className="text-[26px] font-extrabold leading-tight tracking-tight text-text"
          style={{ textWrap: 'balance' }}
        >
          {title}
        </h1>
        {right && <div className="flex-shrink-0 pb-1">{right}</div>}
      </div>
    </div>
  )
}
