export default function Card({ children, className = '', onClick }) {
  const isClickable = Boolean(onClick)
  return (
    <div
      onClick={onClick}
      className={[
        'bg-card border border-border rounded-md overflow-hidden',
        isClickable
          ? 'cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card hover:border-accent/25 active:translate-y-0'
          : '',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  )
}
