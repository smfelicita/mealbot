export default function GroupCard({ group, onClick, delay }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 bg-bg-2 border border-border rounded-xl p-4 text-left hover:border-accent/50 transition-colors fade-up"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="w-12 h-12 rounded-xl bg-bg-3 flex items-center justify-center text-[24px] shrink-0 overflow-hidden">
        {group.avatarUrl
          ? <img src={group.avatarUrl} alt={group.name} className="w-full h-full object-cover" />
          : (group.type === 'FAMILY' ? '👨‍👩‍👧' : '👥')}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-extrabold text-[15px] truncate text-text">{group.name}</span>
          {group.type === 'FAMILY' && (
            <span className="text-2xs font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded shrink-0">СЕМЬЯ</span>
          )}
        </div>
        {group.description && (
          <p className="text-[13px] text-text-2 truncate">{group.description}</p>
        )}
        <div className="flex gap-3 mt-1.5 text-xs text-text-3">
          <span>👤 {group.membersCount} участн.</span>
          <span>🍽️ {group.dishesCount} рецептов</span>
          {group.type === 'FAMILY' && <span>🧊 Общий холодильник</span>}
        </div>
      </div>

      <span className="text-text-3 text-lg shrink-0">›</span>
    </button>
  )
}
