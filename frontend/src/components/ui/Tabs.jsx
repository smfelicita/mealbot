export default function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1.5 p-1 bg-bg-3 rounded-sm">
      {tabs.map(tab => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className={[
            'flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5',
            'text-xs font-bold rounded-[6px] transition-all duration-150',
            'focus:outline-none focus:ring-2 focus:ring-accent/30',
            active === tab.value
              ? 'bg-accent text-white shadow-sm'
              : 'text-text-2 hover:text-text',
          ].join(' ')}
        >
          {tab.icon && <span>{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  )
}
