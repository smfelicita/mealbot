export default function PlanItem({ plan, currentUserId, onNavigate, onRemove }) {
  const dish = plan.dish
  const img  = dish.images?.[0] || dish.imageUrl
  const isOwn = plan.userId === currentUserId

  return (
    <div className="flex items-center gap-2.5 bg-bg-2 border border-border rounded-xl px-3 py-2.5">
      {/* Thumbnail */}
      <button
        type="button"
        onClick={onNavigate}
        className="shrink-0 w-11 h-11 rounded-lg overflow-hidden bg-bg-3 flex items-center justify-center text-[22px]"
      >
        {img
          ? <img src={img} alt="" className="w-full h-full object-cover" />
          : '🍽'}
      </button>

      {/* Info */}
      <button
        type="button"
        onClick={onNavigate}
        className="flex-1 min-w-0 text-left"
      >
        <p className="font-bold text-sm truncate text-text">{dish.nameRu || dish.name}</p>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          {plan.groupId && (
            <span className="text-[11px] text-teal font-semibold">🏠 Семейный</span>
          )}
          {plan.note && (
            <span className="text-[11px] text-text-2">{plan.note}</span>
          )}
          {!isOwn && plan.user && (
            <span className="text-[11px] text-text-3">· {plan.user.name}</span>
          )}
        </div>
      </button>

      {/* Remove */}
      {isOwn && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Убрать"
          className="text-text-3 hover:text-red-400 text-base px-1 shrink-0"
        >✕</button>
      )}
    </div>
  )
}
