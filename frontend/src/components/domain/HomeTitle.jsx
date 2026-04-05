function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Доброе утро'
  if (h < 17) return 'Добрый день'
  return 'Добрый вечер'
}

export default function HomeTitle({ subtitle }) {
  return (
    <div className="mb-5">
      <h1 className="font-serif text-[26px] font-bold leading-tight mb-1">
        {getGreeting()}! 👋
      </h1>
      {subtitle && (
        <p className="text-text-2 text-sm">{subtitle}</p>
      )}
    </div>
  )
}
