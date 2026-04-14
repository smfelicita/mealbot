import { Button } from '../ui'

export default function GroupHeader({ group, isOwner, tab, onTabChange, onBack, onEdit, onDelete, onLeave, onRegenCode, onAddDish, onCopyCode }) {
  return (
    <div className="bg-bg-2 border-b border-border">
      {/* Nav row */}
      <div className="flex items-center gap-2 px-4 pt-3.5 pb-3">
        <Button variant="ghost" size="icon" onClick={onBack}>←</Button>
        <span className="text-[13px] text-text-2">Назад</span>
        <div className="flex-1" />
        {isOwner ? (
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={onEdit}>Редактировать</Button>
            <Button variant="danger" size="sm" onClick={onDelete}>Удалить</Button>
          </div>
        ) : (
          <Button variant="ghost" size="sm" className="text-red-400" onClick={onLeave}>Выйти</Button>
        )}
      </div>

      {/* Group info */}
      <div className="flex gap-3.5 items-start px-4 pb-3">
        <div className="w-[60px] h-[60px] rounded-xl bg-bg-3 flex items-center justify-center text-3xl shrink-0 overflow-hidden">
          {group.avatarUrl
            ? <img src={group.avatarUrl} alt={group.name} className="w-full h-full object-cover" />
            : '👥'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="font-serif text-xl font-extrabold leading-tight">{group.name}</h1>
            {group.type === 'FAMILY' && (
              <span className="text-2xs font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded shrink-0">СЕМЬЯ</span>
            )}
          </div>
          {group.description && (
            <p className="text-[13px] text-text-2 leading-snug">{group.description}</p>
          )}
          <div className="flex gap-3 mt-2 text-xs text-text-3 flex-wrap">
            <span>👤 {group.members.length}{group.type === 'FAMILY' ? '/10' : ''} участников</span>
            <span>🍽️ {group.dishes.length} рецептов</span>
            {group.type === 'FAMILY' && <span>🧊 Общий холодильник</span>}
          </div>
        </div>
      </div>

      {/* Join code (только REGULAR, только владелец) */}
      {group.type === 'REGULAR' && isOwner && group.joinCode && (
        <div className="mx-4 mb-2 bg-bg-3 border border-border rounded-xl px-4 py-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-2xs font-bold text-text-3 uppercase tracking-wider mb-0.5">Код вступления</p>
            <p className="font-mono text-lg font-bold text-text tracking-widest">{group.joinCode}</p>
            {group.joinCodeExpiresAt && (
              <p className="text-2xs text-text-3 mt-0.5">
                до {new Date(group.joinCodeExpiresAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <button type="button" onClick={onCopyCode} className="text-xs font-semibold text-accent">
              Копировать
            </button>
            <button type="button" onClick={onRegenCode} className="text-xs font-semibold text-text-2">
              Обновить
            </button>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 px-4 pb-3.5">
        <Button size="sm" onClick={onAddDish}>+ Блюдо в группу</Button>
      </div>

      {/* Tabs */}
      <div className="flex border-t border-border">
        {[['dishes', 'Блюда'], ['members', 'Участники']].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => onTabChange(key)}
            className={[
              'flex-1 py-2.5 text-[13px] font-bold transition-colors',
              tab === key
                ? 'text-accent border-b-2 border-accent'
                : 'text-text-2 border-b-2 border-transparent hover:text-text',
            ].join(' ')}
          >{label}</button>
        ))}
      </div>
    </div>
  )
}
