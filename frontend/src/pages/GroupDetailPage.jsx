import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useStore } from '../store'
import { Button, Loader, EmptyState, Avatar, useToast } from '../components/ui'
import { RecipeCard } from '../components/domain'

export default function GroupDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const user = useStore(s => s.user)
  const { show, Toast } = useToast()

  const [group, setGroup]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab]       = useState('dishes')

  useEffect(() => {
    api.getGroup(id)
      .then(setGroup)
      .catch(() => navigate('/groups'))
      .finally(() => setLoading(false))
  }, [id])

  async function handleDelete() {
    if (!confirm(`Удалить группу "${group.name}"?`)) return
    try {
      await api.deleteGroup(id)
      navigate('/groups', { replace: true })
    } catch (e) { show(e.message, 'error') }
  }

  async function handleLeave() {
    if (!confirm(`Выйти из группы "${group.name}"?`)) return
    try {
      await api.leaveGroup(id)
      navigate('/groups', { replace: true })
    } catch (e) { show(e.message, 'error') }
  }

  async function handleKick(memberId, memberName) {
    if (!confirm(`Исключить ${memberName}?`)) return
    try {
      await api.kickMember(id, memberId)
      setGroup(g => ({ ...g, members: g.members.filter(m => m.userId !== memberId) }))
      show('Участник исключён', 'success')
    } catch (e) { show(e.message, 'error') }
  }

  function copyCode() {
    navigator.clipboard.writeText(id)
    show('Код скопирован! Поделитесь им с участниками.', 'success')
  }

  if (loading) return <Loader fullPage />
  if (!group) return null

  const isOwner = group.ownerId === user?.id

  return (
    <div className="fade-in">
      {/* ── Header ── */}
      <div className="bg-bg-2 border-b border-border">
        {/* Nav row */}
        <div className="flex items-center gap-2 px-4 pt-3.5 pb-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>←</Button>
          <span className="text-[13px] text-text-2">Назад</span>
          <div className="flex-1" />
          {isOwner ? (
            <div className="flex gap-2">
              <Button variant="secondary" size="sm"
                onClick={() => navigate(`/groups/${id}/edit`)}>Редактировать</Button>
              <Button variant="danger" size="sm" onClick={handleDelete}>Удалить</Button>
            </div>
          ) : (
            <Button variant="ghost" size="sm" className="text-red-400" onClick={handleLeave}>Выйти</Button>
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
              <h1 className="font-serif text-[20px] font-extrabold leading-tight">{group.name}</h1>
              {group.type === 'FAMILY' && (
                <span className="text-[10px] font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded shrink-0">СЕМЬЯ</span>
              )}
            </div>
            {group.description && (
              <p className="text-[13px] text-text-2 leading-snug">{group.description}</p>
            )}
            <div className="flex gap-3 mt-2 text-[12px] text-text-3 flex-wrap">
              <span>👤 {group.members.length} участников</span>
              <span>🍽️ {group.dishes.length} рецептов</span>
              {group.type === 'FAMILY' && <span>🧊 Общий холодильник</span>}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 px-4 pb-3.5">
          <Button variant="secondary" size="sm" onClick={copyCode}>🔑 Код приглашения</Button>
          <Button size="sm"
            onClick={() => navigate('/my-recipes/new', { state: { groupId: id, groupName: group.name, groupType: group.type } })}>
            + Блюдо в группу
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-t border-border">
          {[['dishes', 'Блюда'], ['members', 'Участники']].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
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

      {/* ── Content ── */}
      <div className="px-4 pt-4 pb-8">
        {tab === 'dishes' && (
          group.dishes.length === 0 ? (
            <EmptyState
              icon="🍽️"
              title="Нет рецептов"
              description="Добавьте первый рецепт в группу"
              action={
                <Button onClick={() => navigate('/my-recipes/new', { state: { groupId: id, groupName: group.name } })}>
                  + Добавить рецепт
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {group.dishes.map((d, i) => (
                <div key={d.id} className="fade-up" style={{ animationDelay: `${i * 0.04}s` }}>
                  <RecipeCard dish={d} onClick={() => navigate(`/dishes/${d.id}`)} />
                </div>
              ))}
            </div>
          )
        )}

        {tab === 'members' && (
          <div className="flex flex-col gap-2">
            {group.members.map(member => (
              <div
                key={member.userId}
                className="flex items-center gap-3 bg-bg-2 border border-border rounded-sm px-3.5 py-3"
              >
                <Avatar name={member.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[14px]">{member.name}</p>
                  <p className={[
                    'text-[12px] mt-0.5',
                    member.role === 'OWNER' ? 'text-accent' : 'text-text-3',
                  ].join(' ')}>
                    {member.role === 'OWNER' ? '👑 Владелец' : 'Участник'}
                  </p>
                </div>
                {isOwner && member.userId !== user?.id && (
                  <Button variant="ghost" size="sm" className="text-red-400 shrink-0"
                    onClick={() => handleKick(member.userId, member.name)}>
                    Исключить
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {Toast}
    </div>
  )
}
