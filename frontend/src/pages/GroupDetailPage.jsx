import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useStore } from '../store'
import { Button, Loader, EmptyState, Avatar, useToast } from '../components/ui'
import { DishCard, GroupHeader } from '../components/domain'
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
      <GroupHeader
        group={group}
        isOwner={isOwner}
        tab={tab}
        onTabChange={setTab}
        onBack={() => navigate(-1)}
        onEdit={() => navigate(`/groups/${id}/edit`)}
        onDelete={handleDelete}
        onLeave={handleLeave}
        onAddDish={() => navigate('/dishes/new', { state: { groupId: id, groupName: group.name, groupType: group.type } })}
        onCopyCode={() => { navigator.clipboard.writeText(group.joinCode); show('Код скопирован', 'success') }}
        onRegenCode={async () => {
          try {
            const res = await api.regenerateJoinCode(id)
            setGroup(g => ({ ...g, joinCode: res.joinCode, joinCodeExpiresAt: res.joinCodeExpiresAt }))
            show('Код обновлён', 'success')
          } catch (e) { show(e.message, 'error') }
        }}
      />

      {/* Однократный hint про рецепты группы */}
      {!groupHintDismissed && (
        <div className="mx-4 mt-2 flex items-start gap-3 bg-white rounded-2xl px-4 py-3 shadow-sm">
          <p className="flex-1 text-xs text-text-2">
            Личные рецепты остаются только твоими. Чтобы {group?.type === 'FAMILY' ? 'семья' : 'участники'} увидели блюдо — добавь его в группу.
          </p>
          <button
            type="button"
            onClick={dismissGroupHint}
            className="shrink-0 text-text-3 text-lg leading-none mt-0.5"
          >✕</button>
        </div>
      )}

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
              <p className="text-xs font-bold text-text-2 uppercase tracking-wider mb-2">Пригласить по email</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  className="flex-1 bg-bg-3 border border-border rounded-sm text-text text-sm px-3 py-2 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 placeholder:text-text-3"
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
                  <p className="font-bold text-sm">{member.name}</p>
                  <p className={[
                    'text-xs mt-0.5',
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
