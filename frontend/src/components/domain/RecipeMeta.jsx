const CAT_RU = {
  BREAKFAST: 'Завтрак', LUNCH: 'Обед', DINNER: 'Ужин',
  SOUP: 'Суп', SALAD: 'Салат', SNACK: 'Перекус',
  DESSERT: 'Десерт', DRINK: 'Напиток',
}

const IcoClock  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
const IcoGlobe  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
const IcoFood   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>

export default function RecipeMeta({ dish }) {
  const chips = []

  dish.categories?.forEach(cat => {
    if (CAT_RU[cat]) chips.push({ icon: <IcoFood />, label: CAT_RU[cat] })
  })
  if (dish.cuisine)  chips.push({ icon: <IcoGlobe />, label: dish.cuisine })
  if (dish.cookTime) chips.push({ icon: <IcoClock />, label: `${dish.cookTime} мин` })

  if (!chips.length) return null

  return (
    <div className="flex flex-wrap gap-2 px-4 py-3">
      {chips.map((c, i) => (
        <span
          key={i}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium bg-white text-text-2"
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
        >
          <span className="text-text-3">{c.icon}</span>
          {c.label}
        </span>
      ))}
    </div>
  )
}
