export default function Chip({ children, active = false, onClick, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold',
        'uppercase tracking-wider border transition-all duration-150 cursor-pointer',
        'focus:outline-none focus:ring-2 focus:ring-accent/30',
        active
          ? 'bg-accent/15 border-accent text-accent'
          : 'bg-bg-3 border-border text-text-2 hover:border-accent hover:text-accent',
        className,
      ].join(' ')}
    >
      {children}
    </button>
  )
}
