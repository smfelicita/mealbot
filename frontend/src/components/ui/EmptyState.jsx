export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center text-center py-12 px-5 text-text-2">
      {icon && <div className="text-5xl mb-3">{icon}</div>}
      {title && <h3 className="text-base font-bold text-text mb-1.5">{title}</h3>}
      {description && <p className="text-sm leading-relaxed">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
