import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useStore } from '../store'
import { Button, Loader, EmptyState, Avatar, useToast } from '../components/ui'
import { DishCard } from '../components/domain'
import { useHintDismiss } from '../hooks/useHintDismiss'

export default function GroupDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const user = useStore(s => s.user)
  const { show, Toast } = useToast()

  const [group, setGroup]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab]       = useState('dishes')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [groupHintDismissed, dismissGroupHint] = useHintDismiss('mealbot_hint_group_seen')

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

  async function handleInvite() {
    if (!inviteEmail.trim()) return
    setInviting(true)
    try {
      await api.inviteMember(id, inviteEmail.trim())
      show(`Приглашение отправлено на ${inviteEmail.trim()}`, 'success')
      setInviteEmail('')
    } catch (e) {
      show(e.message, 'error')
    } finally {
      setInviting(false)
    }
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
              <span>👤 {group.members.length}{group.type === 'FAMILY' ? '/10' : ''} участников</span>
              <span>🍽️ {group.dishes.length} рецептов</span>
              {group.type === 'FAMILY' && <span>🧊 Общий холодильник</span>}
            </div>
          </div>
        </div>

        {/* Однократный hint про рецепты группы */}
        {!groupHintDismissed && (
          <div className="mx-4 mb-2 flex items-start gap-3 bg-white rounded-2xl px-4 py-3"
            style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
            <p className="flex-1 text-[12px]" style={{ color: '#666' }}>
              Личные рецепты остаются только твоими. Чтобы {group?.type === 'FAMILY' ? 'семья' : 'участники'} увидели блюдо — добавь его в группу.
            </p>
            <button
              type="button"
              onClick={dismissGroupHint}
              className="shrink-0 text-text-3 text-lg leading-none mt-0.5"
            >✕</button>
          </div>
        )}

        {/* Код вступления (только REGULAR, только владелец) */}
        {group.type === 'REGULAR' && isOwner && group.joinCode && (
          <div className="mx-4 mb-2 bg-bg-3 border border-border rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-text-3 uppercase tracking-wider mb-0.5">Код вступления</p>
              <p className="font-mono text-[18px] font-bold text-text tracking-widest">{group.joinCode}</p>
              {group.joinCodeExpiresAt && (
                <p className="text-[11px] text-text-3 mt-0.5">
                  до {new Date(group.joinCodeExpiresAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(group.joinCode)
                  show('Код скопирован', 'success')
                }}
                className="text-[12px] font-semibold text-accent"
              >Копировать</button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const res = await api.regenerateJoinCode(id)
                    setGroup(g => ({ ...g, joinCode: res.joinCode, joinCodeExpiresAt: res.joinCodeExpiresAt }))
                    show('Код обновлён', 'success')
                  } catch (e) { show(e.message, 'error') }
                }}
                className="text-[12px] font-semibold text-text-2"
              >Обновить</button>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 px-4 pb-3.5">
          <Button size="sm"
            onClick={() => navigate('/dishes/new', { state: { groupId: id, groupName: group.name, groupType: group.type } })}>
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
                <Button onClick={() => navigate('/dishes/new', { state: { groupId: id, groupName: group.name } })}>
                  + Добавить рецепт
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {group.dishes.map((d, i) => (
                <div key={d.id} className="fade-up" style={{ animationDelay: `${i * 0.04}s` }}>
                  <DishCard dish={d} onClick={() => navigate(`/dishes/${d.id}`)} />
                </div>
              ))}
            </div>
          )
        )}

        {tab === 'members' && (
          <div className="flex flex-col gap-3">
            {/* Invite form */}
            <div className="bg-bg-2 border border-border rounded-sm p-3.5">
              <p className="text-[12px] font-bold text-text-2 uppercase tracking-wider mb-2">Пригласить по email</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  className="flex-1 bg-bg-3 border border-border rounded-sm text-text text-[14px] px-3 py-2 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 placeholder:text-text-3"
                  placeholder="email@example.com"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleInvite()}
                />
                <Button size="sm" loading={inviting} onClick={handleInvite}>
                  {!inviting && 'Пригласить'}
                </Button>
              </div>
            </div>

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
