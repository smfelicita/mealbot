// GroupDetailPage — страница группы.
// Портировано из context/design/groups-v2.jsx (без tabs, всё одной простынёй).
// Header — из Layout (back-режим). На странице: Hero, Участники (+ pending), Invite-блок, Danger zone.
// Telegram-share/QR — не делаем (по согласованию).

import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Crown, UserPlus, MoreVertical, Mail, Copy, Check, X,
  Trash2, LogOut, AlertCircle, ChefHat,
} from 'lucide-react'

import { api } from '../api'
import { useStore } from '../store'
import { Loader, useToast } from '../components/ui'
import { DishCard } from '../components/domain'

// ─── Helpers ──────────────────────────────────────────────────────
function pluralMember(n) {
  if (n % 10 === 1 && n % 100 !== 11) return 'участник'
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return 'участника'
  return 'участников'
}

function fmtMonth(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
}

function relativeShort(iso) {
  if (!iso) return ''
  const ms = Date.now() - new Date(iso).getTime()
  const days = Math.floor(ms / 86400000)
  if (days === 0) return 'сегодня'
  if (days === 1) return 'вчера'
  if (days < 7) return `${days} ${days < 5 ? 'дня' : 'дней'} назад`
  return fmtMonth(iso)
}

// ═══ Initial avatar ═══════════════════════════════════════════════
function InitialAvatar({ name, size = 40, isOwner = false }) {
  const initial = (name || '?').trim().charAt(0).toUpperCase()
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className="rounded-full flex items-center justify-center font-bold bg-bg-3 text-accent border border-border"
        style={{ width: size, height: size, fontSize: size * 0.42 }}
      >
        {initial}
      </div>
      {isOwner && (
        <div
          className="absolute flex items-center justify-center rounded-full bg-bg-2 border border-border"
          style={{ top: -3, right: -3, width: 14, height: 14 }}
        >
          <Crown size={9} strokeWidth={2.4} className="text-accent" fill="currentColor" />
        </div>
      )}
    </div>
  )
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
      {isFamily ? 'FAMILY · Семья' : 'REGULAR · Группа'}
    </span>
  )
}

// ═══ Hero ═════════════════════════════════════════════════════════
function GroupHero({ group, dishesCount }) {
  const isFamily = group.type === 'FAMILY'
  const memberCount = group.members?.length || 0

  return (
    <div className={[
      'rounded-2xl p-5 border',
      isFamily ? 'bg-accent-muted border-accent-border' : 'bg-sage-muted border-sage-border',
    ].join(' ')}>
      <div className="flex items-center justify-between gap-2">
        <TypeBadge type={group.type} />
        {group.createdAt && (
          <span className="text-[12px] text-text-3">С {fmtMonth(group.createdAt)}</span>
        )}
      </div>

      <h1
        className="mt-2 text-[24px] font-extrabold tracking-tight leading-tight text-text"
        style={{ textWrap: 'balance' }}
      >
        {group.name}
      </h1>

      {group.description && (
        <p className="mt-1 text-[13px] text-text-2" style={{ textWrap: 'pretty' }}>
          {group.description}
        </p>
      )}

      <p className="mt-1 text-[13px] text-text-2">
        {memberCount} {pluralMember(memberCount)} · {isFamily ? 'Общий холодильник и план' : 'Общий каталог блюд'}
      </p>

      <div className="flex gap-2 mt-4">
        <HeroMetric label="Блюд" value={dishesCount} />
        <HeroMetric label="Участников" value={memberCount} />
      </div>
    </div>
  )
}

function HeroMetric({ label, value }) {
  return (
    <div className="flex-1 rounded-xl bg-bg-2 border border-border px-3 py-2 flex flex-col">
      <div
        className="text-[10px] font-bold uppercase tracking-wider text-text-3"
        style={{ letterSpacing: 0.6 }}
      >
        {label}
      </div>
      <div className="text-[18px] font-extrabold tabular-nums leading-none mt-1 text-text">
        {value}
      </div>
    </div>
  )
}

// ═══ Member row ═══════════════════════════════════════════════════
function MemberRow({ member, isMe, ownerView, onKick }) {
  const owner = member.role === 'OWNER'
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="rounded-xl bg-bg-2 border border-border p-3 flex items-center gap-3 relative">
      <InitialAvatar name={member.name} size={40} isOwner={owner} />
      <div className="flex-1 min-w-0">
        <div className="text-[14.5px] font-semibold leading-tight text-text truncate">
          {member.name}
        </div>
        <div className="text-[11px] mt-0.5 text-text-3">
          {owner ? 'владелец' : 'участник'}
          {member.joinedAt && ` · с ${fmtMonth(member.joinedAt)}`}
        </div>
      </div>

      {isMe && (
        <span
          className="text-[10.5px] font-bold uppercase tracking-wider bg-accent-muted text-accent rounded-full px-2 py-0.5"
          style={{ letterSpacing: 0.6 }}
        >
          Это вы
        </span>
      )}

      {ownerView && !isMe && (
        <button
          type="button"
          onClick={() => setMenuOpen(o => !o)}
          className={[
            'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
            menuOpen ? 'bg-bg-3 text-text-2' : 'text-text-2',
          ].join(' ')}
          aria-label="Меню участника"
        >
          <MoreVertical size={16} strokeWidth={2} />
        </button>
      )}

      {menuOpen && (
        <>
          {/* tap-outside */}
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 z-30"
            aria-label="Закрыть меню"
          />
          <div
            className="absolute z-40 bg-bg-2 rounded-xl border border-border p-1.5"
            style={{ top: 50, right: 8, width: 220, boxShadow: '0 14px 40px rgba(0,0,0,0.15)' }}
          >
            <button
              type="button"
              onClick={() => { setMenuOpen(false); onKick(member) }}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-[13.5px] font-semibold text-left text-red-500"
            >
              <Trash2 size={15} strokeWidth={2.2} />
              Удалить из группы
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ═══ Pending invite row ═══════════════════════════════════════════
function PendingRow({ invite, canRevoke, onRevoke }) {
  return (
    <div
      className="rounded-xl bg-bg-3 p-3 flex items-center gap-3"
      style={{ border: '1px dashed var(--color-border)' }}
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-bg-2"
        style={{ border: '1px dashed var(--color-border)' }}
      >
        <Mail size={16} strokeWidth={2} className="text-text-3" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13.5px] font-semibold truncate text-text-2">{invite.email}</div>
        <div className="text-[11px] mt-0.5 text-text-3">
          приглашение отправлено · {relativeShort(invite.invitedAt)}
        </div>
      </div>
      <span
        className="text-[10.5px] font-bold uppercase tracking-wider bg-bg-2 text-text-3 border border-border rounded-full px-2 py-0.5 shrink-0"
        style={{ letterSpacing: 0.6 }}
      >
        ожидает
      </span>
      {canRevoke && (
        <button
          type="button"
          onClick={() => onRevoke(invite)}
          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-text-3"
          aria-label="Отозвать"
        >
          <X size={14} strokeWidth={2.2} />
        </button>
      )}
    </div>
  )
}

// ═══ Invite block (joinCode + email) ═════════════════════════════
function InviteBlock({ group, isOwner, onInviteEmail, onCopyCode, onRegenCode }) {
  const isFamily = group.type === 'FAMILY'
  const [email, setEmail] = useState('')
  const [emailErr, setEmailErr] = useState('')
  const [sending, setSending] = useState(false)
  const [copied, setCopied] = useState(false)

  // Email-приглашать в FAMILY может только owner (бэк это enforce'ит)
  const canEmailInvite = !isFamily || isOwner

  function handleCopy() {
    onCopyCode()
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  async function handleSendEmail(e) {
    e.preventDefault()
    const v = email.trim()
    if (!v) return
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      setEmailErr('Введите корректный email')
      return
    }
    setEmailErr('')
    setSending(true)
    try {
      await onInviteEmail(v)
      setEmail('')
    } catch (e) {
      setEmailErr(e.message || 'Ошибка отправки')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="rounded-2xl bg-bg-2 border border-border p-4 flex flex-col gap-4">
      <div>
        <div className="text-[14px] font-bold text-text">Пригласить в группу</div>
        <div className="text-[12px] mt-0.5 text-text-3" style={{ textWrap: 'pretty' }}>
          {isFamily
            ? 'Только владелец группы может отправлять приглашения'
            : 'Отправьте email — приглашённый получит письмо со ссылкой'}
        </div>
      </div>

      {/* Join code (только для REGULAR) */}
      {group.joinCode && (
        <div className="flex flex-col gap-1.5">
          <div
            className="text-[10.5px] font-bold uppercase tracking-wider text-text-3"
            style={{ letterSpacing: 0.6 }}
          >
            Код для вступления
          </div>
          <div
            className="flex items-center pl-4 pr-1 py-1 rounded-full bg-bg-3 border border-border relative"
          >
            <div className="flex-1 text-[14px] font-mono tracking-wide text-text-2 truncate">
              {group.joinCode}
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-accent text-white"
              aria-label="Скопировать"
            >
              {copied
                ? <Check size={14} strokeWidth={2.6} />
                : <Copy size={14} strokeWidth={2.2} />}
            </button>
            {copied && (
              <div
                className="absolute"
                style={{
                  right: 8, top: -32,
                  padding: '4px 10px', borderRadius: 9999,
                  background: 'var(--color-text)', color: '#fff', fontSize: 11, fontWeight: 700,
                  boxShadow: '0 6px 18px rgba(0,0,0,0.18)',
                }}
              >
                Скопировано ✓
              </div>
            )}
          </div>
          {isOwner && onRegenCode && (
            <button
              type="button"
              onClick={onRegenCode}
              className="text-[12px] font-semibold text-accent self-start mt-0.5"
            >
              Сгенерировать новый код
            </button>
          )}
        </div>
      )}

      {/* Email invite */}
      {canEmailInvite && (
        <form onSubmit={handleSendEmail} className="flex flex-col gap-1.5">
          <div
            className="text-[10.5px] font-bold uppercase tracking-wider text-text-3"
            style={{ letterSpacing: 0.6 }}
          >
            Email-приглашение
          </div>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setEmailErr('') }}
              placeholder="email@example.com"
              className={[
                'flex-1 h-10 px-4 rounded-full bg-bg-3 border outline-none text-[13.5px]',
                emailErr ? 'border-red-300' : 'border-border focus:border-accent',
              ].join(' ')}
            />
            <button
              type="submit"
              disabled={sending}
              className="h-10 px-4 rounded-full bg-accent text-white text-[13px] font-bold disabled:opacity-60"
            >
              {sending ? '...' : 'Отправить'}
            </button>
          </div>
          {emailErr && (
            <div className="flex items-start gap-1 text-red-500 text-[12px] mt-0.5">
              <AlertCircle size={12} strokeWidth={2.2} className="mt-0.5 shrink-0" />
              <span>{emailErr}</span>
            </div>
          )}
        </form>
      )}
    </div>
  )
}

// ═══ Danger zone ══════════════════════════════════════════════════
function DangerZone({ isOwner, onLeave, onDelete }) {
  return (
    <div className="pt-5 mt-7 border-t border-border flex flex-col gap-2 items-start">
      {isOwner ? (
        <button
          type="button"
          onClick={onDelete}
          className="h-10 rounded-full text-[13px] font-bold flex items-center gap-2 px-1 text-red-500"
        >
          <Trash2 size={14} strokeWidth={2.2} />
          Удалить группу навсегда
        </button>
      ) : (
        <button
          type="button"
          onClick={onLeave}
          className="h-10 rounded-full text-[13px] font-bold flex items-center gap-2 px-1 text-red-500"
        >
          <LogOut size={14} strokeWidth={2.2} />
          Выйти из группы
        </button>
      )}
    </div>
  )
}

// ═══ Section title (внутренний) ═══════════════════════════════════
function SectionTitleRow({ title, count, action }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="text-[15px] font-bold text-text">
        {title}
        {count != null && (
          <span className="tabular-nums text-text-3 font-semibold"> · {count}</span>
        )}
      </div>
      {action}
    </div>
  )
}

// ═══ Main page ════════════════════════════════════════════════════
export default function GroupDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const user = useStore(s => s.user)
  const { show, Toast } = useToast()

  const [group, setGroup]       = useState(null)
  const [pending, setPending]   = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([
      api.getGroup(id),
      api.getGroupInvites(id).catch(() => []),
    ])
      .then(([g, p]) => {
        setGroup(g)
        setPending(p)
      })
      .catch(() => navigate('/groups'))
      .finally(() => setLoading(false))
  }, [id])

  const isOwner = useMemo(() => group?.ownerId === user?.id, [group, user])

  async function handleInviteEmail(email) {
    await api.inviteMember(id, email)
    show(`Приглашение отправлено на ${email}`, 'success')
    // Обновим pending
    api.getGroupInvites(id).then(setPending).catch(() => {})
  }

  async function handleRevoke(invite) {
    try {
      await api.revokeInvite(id, invite.token)
      setPending(prev => prev.filter(p => p.token !== invite.token))
      show('Приглашение отозвано', 'success')
    } catch (e) { show(e.message, 'error') }
  }

  async function handleKick(member) {
    if (!confirm(`Удалить ${member.name} из группы?`)) return
    try {
      await api.kickMember(id, member.userId)
      setGroup(g => ({ ...g, members: g.members.filter(m => m.userId !== member.userId) }))
      show('Участник удалён', 'success')
    } catch (e) { show(e.message, 'error') }
  }

  async function handleLeave() {
    if (!confirm(`Выйти из группы «${group.name}»?`)) return
    try {
      await api.leaveGroup(id)
      navigate('/groups', { replace: true })
    } catch (e) { show(e.message, 'error') }
  }

  async function handleDelete() {
    if (!confirm(`Удалить группу «${group.name}» навсегда?`)) return
    try {
      await api.deleteGroup(id)
      navigate('/groups', { replace: true })
    } catch (e) { show(e.message, 'error') }
  }

  function handleCopyCode() {
    if (!group?.joinCode) return
    navigator.clipboard.writeText(group.joinCode).catch(() => {})
    show('Код скопирован', 'success')
  }

  async function handleRegenCode() {
    try {
      const res = await api.regenerateJoinCode(id)
      setGroup(g => ({ ...g, joinCode: res.joinCode, joinCodeExpiresAt: res.joinCodeExpiresAt }))
      show('Код обновлён', 'success')
    } catch (e) { show(e.message, 'error') }
  }

  if (loading) return <Loader fullPage />
  if (!group) return null

  const dishesCount = group.dishes?.length || 0

  return (
    <div>
      <div className="px-5 pt-1 pb-24 fade-in">
        <GroupHero group={group} dishesCount={dishesCount} />

        {/* Участники + pending */}
        <section className="mt-7">
          <SectionTitleRow
            title="Участники"
            count={group.members.length}
            action={
              isOwner && (
                <button
                  type="button"
                  onClick={() => {
                    document.getElementById('invite-block')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                  }}
                  className="text-[13px] font-bold text-accent flex items-center gap-1"
                >
                  <UserPlus size={14} strokeWidth={2.2} />
                  Пригласить
                </button>
              )
            }
          />

          <div className="flex flex-col gap-2">
            {group.members.map(m => (
              <MemberRow
                key={m.userId}
                member={m}
                isMe={m.userId === user?.id}
                ownerView={isOwner}
                onKick={handleKick}
              />
            ))}
            {pending.map(inv => (
              <PendingRow
                key={inv.token}
                invite={inv}
                canRevoke={isOwner || inv.invitedById === user?.id}
                onRevoke={handleRevoke}
              />
            ))}
          </div>
        </section>

        {/* Invite block */}
        <section className="mt-7" id="invite-block">
          <InviteBlock
            group={group}
            isOwner={isOwner}
            onInviteEmail={handleInviteEmail}
            onCopyCode={handleCopyCode}
            onRegenCode={isOwner && group.type === 'REGULAR' ? handleRegenCode : null}
          />
        </section>

        {/* Блюда группы */}
        {group.dishes && group.dishes.length > 0 && (
          <section className="mt-7">
            <SectionTitleRow
              title="Блюда группы"
              count={group.dishes.length}
              action={
                <button
                  type="button"
                  onClick={() => navigate('/dishes/new', {
                    state: { groupId: id, groupName: group.name, groupType: group.type },
                  })}
                  className="text-[13px] font-bold text-accent flex items-center gap-1"
                >
                  <ChefHat size={14} strokeWidth={2.2} />
                  Добавить
                </button>
              }
            />
            <div className="flex flex-col gap-3">
              {group.dishes.map(d => (
                <DishCard key={d.id} dish={d} onClick={() => navigate(`/dishes/${d.id}`)} />
              ))}
            </div>
          </section>
        )}

        <DangerZone
          isOwner={isOwner}
          onLeave={handleLeave}
          onDelete={handleDelete}
        />
      </div>

      {Toast}
    </div>
  )
}
