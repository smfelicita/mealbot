export default function TopBar({ title, left, right }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 sticky top-0 bg-bg/95 backdrop-blur-md border-b border-border z-50 min-h-[52px]">
      {left && <div className="flex items-center shrink-0">{left}</div>}
      {title && (
        <span className="font-serif text-xl text-accent font-bold truncate flex-1">
          {title}
        </span>
      )}
      {right && <div className="flex items-center gap-2 shrink-0 ml-auto">{right}</div>}
    </div>
  )
}
