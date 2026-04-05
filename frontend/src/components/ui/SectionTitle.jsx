export default function SectionTitle({ children, className = '' }) {
  return (
    <h2 className={`font-serif text-lg font-bold text-text mb-3 ${className}`}>
      {children}
    </h2>
  )
}
