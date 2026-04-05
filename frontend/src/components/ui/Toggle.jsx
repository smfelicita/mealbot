export default function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer select-none">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={[
          'relative w-11 h-6 rounded-full border transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-accent/30',
          checked ? 'bg-accent border-accent' : 'bg-bg-3 border-border',
        ].join(' ')}
      >
        <span className={[
          'absolute top-0.5 left-0.5 w-[18px] h-[18px] bg-white rounded-full',
          'transition-transform duration-200 shadow-sm',
          checked ? 'translate-x-5' : 'translate-x-0',
        ].join(' ')} />
      </button>
      {label && <span className="text-sm font-bold text-text-2">{label}</span>}
    </label>
  )
}
