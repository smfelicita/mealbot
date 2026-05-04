// GroupsPage — список групп пользователя.
// Портировано из context/design/groups-v2.jsx.
// Состояния: guest / empty / list (с входящими приглашениями сверху).
// FRIENDS из артефакта → REGULAR на бэке.

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, Crown, ChevronRight, Mail, X, Plus, Home, Heart,
} from 'lucide-react'

import { api } from '../api'
import { useStore } from '../store'
import { Loader, GuestBlock, PageHeader, useToast } from '../components/ui'

// ─── Helpers ──────────────────────────────────────────────────────
function pluralGroup(n) {
  if (n % 10 === 1 && n % 100 !== 11) return 'группа'
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return 'группы'
  return 'групп'
}

function pluralMember(n) {
  if (n % 10 === 1 && n % 100 !== 11) return 'участник'
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return 'участника'
  return 'участников'
}

function relativeTime(iso) {
  if (!iso) return ''
  const ms = Date.now() - new Date(iso).getTime()
  const days = Math.floor(ms / 86400000)
  if (days === 0) return 'сегодня'
  if (days === 1) return 'вчера'
  if (days < 7) return `${days} ${days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'} назад`
  const weeks = Math.floor(days / 7)
  if (weeks < 4) return `${weeks} ${weeks === 1 ? 'неделю' : weeks < 5 ? 'недели' : 'недель'} назад`
  const months = Math.floor(days / 30)
  return `${months} ${months === 1 ? 'месяц' : months < 5 ? 'месяца' : 'месяцев'} назад`
}

// ═══ TypeBadge ════════════════════════════════════════════════════
function TypeBadge({ type }) {
  const isFamily = type === 'FAMILY'
  return (
    <span className={[
      'inline-flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5 border',
      isFamily
        ? 'bg-accent-muted border-accent-border text-accent'
        : 'bg-sage-muted border-sage-border text-sage',
    ].join(' ')}
    style={{ letterSpacing: 0.6 }}
    >
      {isFamily ? 'Семья' : 'Группа'}
    </span>
  )
}

// ═══ SectionLabel ═════════════════════════════════════════════════
function SectionLabel({ children, count }) {
  return (
    <div
      className="text-[11px] font-bold uppercase tracking-wider text-text-2 mb-3"
      style={{ letterSpacing: 0.6 }}
    >
      {children}
      {count != null && <span className="tabular-nums"> · {count}</span>}
    </div>
  )
}

// ═══ Incoming invite card ═════════════════════════════════════════
function IncomingInviteCard({ invite, onAccept, onDecline }) {
  return (
    <div className="rounded-2xl bg-bg-2 border border-accent-border p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-accent-muted">
        <Mail size={18} strokeWidth={2} className="text-accent" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-semibold leading-tight text-text">
          {invite.groupName}
        </div>
        <div className="text-[12px] mt-0.5 text-text-3 truncate">
          от {invite.invitedByName} · {relativeTime(invite.invitedAt)}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={() => onAccept(invite)}
          className="h-8 px-3 rounded-full text-white text-[12.5px] font-bold bg-accent"
        >
          Принять
        </button>
        <button
          type="button"
          onClick={() => onDecline(invite)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-text-3"
          aria-label="Отклонить"
        >
          <X size={15} strokeWidth={2.2} />
        </button>
      </div>
    </div>
  )
}

// ═══ Group card ═══════════════════════════════════════════════════
function GroupCard({ group, currentUserId, onClick }) {
  const isFamily = group.type === 'FAMILY'
  const TypeIcon = isFamily ? Home : Heart
  const meIsOwner = group.ownerId === currentUserId
  // GET /api/groups возвращает membersCount/dishesCount (не вложенные members[]/dishes[])
  const memberCount = group.membersCount ?? 0
  const dishesCount = group.dishesCount ?? 0

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-2xl bg-bg-2 border border-border p-4 active:scale-[0.99] transition-transform"
    >
      <div className="flex items-start gap-3">
        <div className={[
          'rounded-xl flex items-center justify-center shrink-0 border',
          isFamily ? 'bg-accent-muted border-accent-border' : 'bg-sage-muted border-sage-border',
        ].join(' ')}
        style={{ width: 48, height: 48 }}
        >
          <TypeIcon
            size={22}
            strokeWidth={2}
            className={isFamily ? 'text-accent' : 'text-sage'}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="text-[16px] font-bold leading-tight truncate text-text">
              {group.name}
            </div>
            {meIsOwner && (
              <Crown size={12} strokeWidth={2.4} className="text-accent shrink-0" fill="currentColor" />
            )}
          </div>
          <TypeBadge type={group.type} />
        </div>
        <ChevronRight size={18} strokeWidth={2} className="text-text-3 shrink-0 mt-1" />
      </div>

      <div
        className="mt-3 pt-3 text-[12px] tabular-nums text-text-3"
        style={{ borderTop: '1px dashed var(--color-border)' }}
      >
        {memberCount} {pluralMember(memberCount)} · {dishesCount} блюд
      </div>
    </button>
  )
}

// ═══ FAB ══════════════════════════════════════════════════════════
function FAB({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed h-12 px-4 rounded-full flex items-center gap-1.5 bg-accent text-white text-[13.5px] font-bold z-40
        active:scale-95 transition-transform"
      style={{ right: 16, bottom: 80, boxShadow: '0 8px 24px rgba(196,112,74,0.45)' }}
      aria-label="Создать группу"
    >
      <Plus size={16} strokeWidth={2.4} />
      Создать группу
    </button>
  )
}

// ═══ Empty state (нет групп) ══════════════════════════════════════
function NoGroupsEmpty({ onCreate }) {
  return (
    <div className="flex flex-col items-center text-center px-4" style={{ paddingTop: 40 }}>
      <div
        className="w-[72px] h-[72px] rounded-full flex items-center justify-center bg-accent-muted border border-accent-border"
      >
        <Users size={30} strokeWidth={2} className="text-accent" />
      </div>
      <h2 className="mt-4 text-[17px] font-bold text-text" style={{ textWrap: 'balance' }}>
        У тебя пока нет групп
      </h2>
      <p className="mt-1 text-[13px] leading-relaxed max-w-[290px] text-text-2" style={{ textWrap: 'pretty' }}>
        Создай семейную группу, чтобы делить холодильник, или обычную — чтобы обмениваться рецептами с друзьями
      </p>
      <button
        type="button"
        onClick={onCreate}
        className="mt-6 h-12 px-6 rounded-full bg-accent text-white text-[13.5px] font-bold flex items-center gap-1.5"
        style={{ boxShadow: '0 6px 18px rgba(196,112,74,0.30)' }}
      >
        <Plus size={15} strokeWidth={2.4} />
        Создать группу
      </button>
    </div>
  )
}

// ═══ Guest block ══════════════════════════════════════════════════
function GuestGroupsBlock() {
  return (
    <div>
      <PageHeader title="Мои группы" />
      <div className="px-5 pt-4">
        <GuestBlock
          icon={<Users size={26} strokeWidth={1.8} />}
          title="Готовьте вместе"
          description="Создайте семейную группу — общий холодильник, план и любимые блюда"
          registerText="Создать свою кухню"
          loginText="Уже есть аккаунт? Войти"
        />
      </div>
    </div>
  )
}

// ═══ Main page ════════════════════════════════════════════════════
export default function GroupsPage() {
  const navigate = useNavigate()
  const user  = useStore(s => s.user)
  const token = useStore(s => s.token)
  const { show, Toast } = useToast()

  const [groups, setGroups]     = useState([])
  const [invites, setInvites]   = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (!token) return
    setLoading(true)
    Promise.all([
      api.getGroups().catch(() => []),
      api.getIncomingInvites().catch(() => []),
    ]).then(([g, i]) => {
      setGroups(g)
      setInvites(i)
    }).finally(() => setLoading(false))
  }, [token])

  async function handleAccept(invite) {
    try {
      await api.acceptInvite(invite.token)
      show(`Вы вступили в «${invite.groupName}»`, 'success')
      // Обновляем оба списка
      const [g, i] = await Promise.all([api.getGroups(), api.getIncomingInvites()])
      setGroups(g)
      setInvites(i)
    } catch (e) { show(e.message, 'error') }
  }

  async function handleDecline(invite) {
    if (!confirm(`Отклонить приглашение в «${invite.groupName}»?`)) return
    try {
      await api.revokeInvite(invite.groupId, invite.token)
      setInvites(prev => prev.filter(x => x.token !== invite.token))
      show('Приглашение отклонено', 'success')
    } catch (e) { show(e.message, 'error') }
  }

  if (!token) return <GuestGroupsBlock />
  if (loading) return <Loader fullPage />

  const isEmpty = groups.length === 0 && invites.length === 0

  return (
    <div>
      <PageHeader
        title="Мои группы"
        right={groups.length > 0 && (
          <span className="text-[12px] tabular-nums text-text-3">
            {groups.length} {pluralGroup(groups.length)}
          </span>
        )}
      />

      <div className="px-5 pt-1 pb-28">
        {isEmpty ? (
          <div className="mt-7">
            <NoGroupsEmpty onCreate={() => navigate('/groups/new')} />
          </div>
        ) : (
          <>
            {invites.length > 0 && (
              <div className="mt-7">
                <SectionLabel count={invites.length}>Приглашения</SectionLabel>
                <div className="flex flex-col gap-2">
                  {invites.map(inv => (
                    <IncomingInviteCard
                      key={inv.token}
                      invite={inv}
                      onAccept={handleAccept}
                      onDecline={handleDecline}
                    />
                  ))}
                </div>
              </div>
            )}

            {groups.length > 0 && (
              <div className="mt-7">
                <SectionLabel count={groups.length}>Мои группы</SectionLabel>
                <div className="flex flex-col gap-2">
                  {groups.map(g => (
                    <GroupCard
                      key={g.id}
                      group={g}
                      currentUserId={user?.id}
                      onClick={() => navigate(`/groups/${g.id}`)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <FAB onClick={() => navigate('/groups/new')} />

      {Toast}
    </div>
  )
}
