// ProfilePage — профиль пользователя.
// Переписан в стиле context/design/brief-profile.md, но под актуальный API:
// - нет Pro-плашки / stats / смены языка / toggle уведомлений / удаления аккаунта
//   (всё это пока не реализовано на бэке)
// - есть Hero, Telegram-подключение, Выход
// Когда фичи появятся на бэке — секции добавляются по аналогии.

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Mail, MessageCircle, LogOut, Check,
} from 'lucide-react'

import { api } from '../api'
import { useStore } from '../store'
import { Avatar, Loader, useToast } from '../components/ui'

// ─── Helpers ──────────────────────────────────────────────────────
function fmtDate(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

function roleLabel(role) {
  if (role === 'ADMIN') return 'Администратор'
  return 'Пользователь'
}

// ═══ Section header ═══════════════════════════════════════════════
function SectionLabel({ children }) {
  return (
    <div
      className="text-[11px] font-bold uppercase tracking-wider text-text-3 mb-2.5 px-1"
      style={{ letterSpacing: 0.6 }}
    >
      {children}
    </div>
  )
}

// ═══ Hero ═════════════════════════════════════════════════════════
function Hero({ profile }) {
  return (
    <div className="bg-bg-2 border border-border rounded-2xl p-5">
      <div className="flex items-center gap-4">
        <Avatar name={profile?.name} size="xl" />
        <div className="flex-1 min-w-0">
          <div
            className="text-[20px] font-extrabold text-text leading-tight"
            style={{ textWrap: 'balance' }}
          >
            {profile?.name || 'Без имени'}
          </div>
          {profile?.email && (
            <div className="flex items-center gap-1 text-[13px] text-text-3 mt-0.5 truncate">
              <Mail size={12} strokeWidth={2} />
              <span className="truncate">{profile.email}</span>
            </div>
          )}
          <div className="mt-2 inline-flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-wide
            bg-bg-3 border border-border text-text-2 rounded-full px-2.5 py-1"
            style={{ letterSpacing: 0.4 }}
          >
            {roleLabel(profile?.role)}
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══ Info block (email/phone verification statuses) ═══════════════
function InfoRow({ Icon, label, value, badge }) {
  return (
    <div className="flex items-center gap-3 px-3 py-3">
      <Icon size={18} strokeWidth={2} className="text-accent shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-[11px] uppercase tracking-wider text-text-3 font-bold" style={{ letterSpacing: 0.4 }}>
          {label}
        </div>
        <div className="text-[14px] font-semibold text-text truncate">
          {value || '—'}
        </div>
      </div>
      {badge}
    </div>
  )
}

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-wide
      bg-sage-muted border border-sage-border text-sage rounded-full px-2 py-0.5"
      style={{ letterSpacing: 0.3 }}
    >
      <Check size={10} strokeWidth={3} />
      подтв.
    </span>
  )
}

function NotVerifiedBadge() {
  return (
    <span className="text-[10.5px] font-bold uppercase tracking-wide text-text-3"
      style={{ letterSpacing: 0.3 }}
    >
      не подтв.
    </span>
  )
}

// ═══ Telegram block ═══════════════════════════════════════════════
function TelegramBlock({ profile, onConnect, tgLink, tgLoading, tgError }) {
  const connected = !!profile?.telegramId

  return (
    <div className="bg-bg-2 border border-border rounded-2xl p-4 flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
        style={{ background: '#229ED9' }}
      >
        <MessageCircle size={18} strokeWidth={2.2} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[14.5px] font-semibold text-text">Telegram-бот</div>
        <div className="text-[12px] text-text-3 mt-0.5">
          {connected
            ? (profile.telegramUsername ? `@${profile.telegramUsername}` : 'Подключён')
            : 'Холодильник, план и рецепты в чате'}
        </div>
        {tgError && (
          <div className="text-[12px] text-red-500 mt-1">{tgError}</div>
        )}
      </div>
      {connected ? (
        <span className="inline-flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-wide
          bg-sage-muted border border-sage-border text-sage rounded-full px-2.5 py-1 shrink-0"
          style={{ letterSpacing: 0.3 }}
        >
          <Check size={10} strokeWidth={3} />
          подключено
        </span>
      ) : tgLink ? (
        <a
          href={tgLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center bg-accent text-white text-[12px] font-bold
            rounded-full px-3.5 py-1.5 shrink-0"
        >
          Открыть бота →
        </a>
      ) : (
        <button
          type="button"
          onClick={onConnect}
          disabled={tgLoading}
          className="inline-flex items-center justify-center bg-accent text-white text-[12px] font-bold
            rounded-full px-3.5 py-1.5 shrink-0 disabled:opacity-60"
        >
          {tgLoading ? '...' : 'Подключить'}
        </button>
      )}
    </div>
  )
}

// ═══ Action row (logout) ══════════════════════════════════════════
function ActionRow({ Icon, label, onClick, danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'w-full bg-bg-2 border border-border rounded-xl p-4 flex items-center gap-3 transition-colors',
        danger ? 'text-red-500 active:bg-red-50' : 'text-text active:bg-bg-3',
      ].join(' ')}
    >
      <Icon size={18} strokeWidth={2} className={danger ? 'text-red-500' : 'text-text-2'} />
      <span className="text-[14px] font-semibold">{label}</span>
    </button>
  )
}

// ═══ Main ═════════════════════════════════════════════════════════
export default function ProfilePage() {
  const logout   = useStore(s => s.logout)
  const navigate = useNavigate()
  const { show, Toast } = useToast()

  const [profile, setProfile]     = useState(null)
  const [loading, setLoading]     = useState(true)
  const [tgLink, setTgLink]       = useState(null)
  const [tgLoading, setTgLoading] = useState(false)
  const [tgError, setTgError]     = useState('')

  useEffect(() => {
    api.me()
      .then(setProfile)
      .catch(() => navigate('/auth'))
      .finally(() => setLoading(false))
  }, [])

  async function connectTelegram() {
    setTgLoading(true)
    setTgError('')
    try {
      const { url } = await api.generateTelegramLink()
      setTgLink(url)
    } catch (err) {
      setTgError(err.message || 'Не удалось получить ссылку')
    }
    setTgLoading(false)
  }

  async function handleLogout() {
    try { await api.logout() } catch {}
    logout()
    navigate('/auth')
  }

  if (loading) return <Loader fullPage />

  return (
    <div>
      <div className="px-5 pt-1 pb-24 fade-in">
        <Hero profile={profile} />

        {/* Контактные данные (email, phone — то что подтверждено / нет) */}
        {(profile?.email || profile?.phone) && (
          <div className="mt-7">
            <SectionLabel>Контакты</SectionLabel>
            <div className="bg-bg-2 border border-border rounded-2xl divide-y divide-border">
              {profile?.email && (
                <InfoRow
                  Icon={Mail}
                  label="Email"
                  value={profile.email}
                  badge={profile.emailVerified ? <VerifiedBadge /> : <NotVerifiedBadge />}
                />
              )}
              {profile?.phone && (
                <InfoRow
                  Icon={MessageCircle}
                  label="Телефон"
                  value={profile.phone}
                  badge={profile.phoneVerified ? <VerifiedBadge /> : <NotVerifiedBadge />}
                />
              )}
            </div>
          </div>
        )}

        <div className="mt-7">
          <SectionLabel>Подключения</SectionLabel>
          <TelegramBlock
            profile={profile}
            onConnect={connectTelegram}
            tgLink={tgLink}
            tgLoading={tgLoading}
            tgError={tgError}
          />
        </div>

        <div className="mt-7">
          <SectionLabel>Аккаунт</SectionLabel>
          <ActionRow Icon={LogOut} label="Выйти из аккаунта" onClick={handleLogout} danger />
        </div>
      </div>

      {Toast}
    </div>
  )
}
