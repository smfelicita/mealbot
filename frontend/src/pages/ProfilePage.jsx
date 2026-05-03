// ProfilePage — профиль пользователя.
// Портировано из context/design/profile-v2.jsx, но только то что есть на бэке:
// - Hero (avatar 72px + Pro-обводка по subscriptionUntil + name + Pro/Free-чип + email + дата)
// - Telegram-row (подключено / нет)
// - Настройки → Язык (RU/EN) — переключение через i18n.changeLanguage + localStorage
// - Аккаунт → Выйти
//
// Не реализовано (по согласованию):
// - Stats (нет API)
// - ProUpgrade / Subscription (монетизация не запущена — тулбар скрыт)
// - Toggle уведомлений (отдельная задача)
// - Удалить аккаунт (нет API)
// - Версия приложения (не нужно сейчас)
//
// Реальное переключение языка (английский перевод страниц) — в бэклоге как
// отдельная задача: обернуть строки в t() и добавить en/*.json.

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Crown, Globe, LogOut, Check, MessageCircle, ChevronRight,
} from 'lucide-react'

import i18n from '../i18n'
import { api } from '../api'
import { useStore } from '../store'
import { Loader, useToast } from '../components/ui'

// ─── Локали для селектора ────────────────────────────────────────
const LANGUAGES = [
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
]

// ─── Helpers ─────────────────────────────────────────────────────
function fmtDate(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

function isPro(profile) {
  if (!profile?.subscriptionUntil) return false
  return new Date(profile.subscriptionUntil) > new Date()
}

// ═══ Section header ══════════════════════════════════════════════
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

// ═══ Hero ════════════════════════════════════════════════════════
function Hero({ profile }) {
  const pro = isPro(profile)
  const initial = (profile?.name || profile?.email || '?').trim().charAt(0).toUpperCase()
  const joined = fmtDate(profile?.createdAt)

  return (
    <div
      className="rounded-2xl bg-bg-2 border border-border p-5 flex items-center gap-4"
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}
    >
      <div
        className="rounded-full flex items-center justify-center shrink-0 bg-accent-muted text-accent font-extrabold"
        style={{
          width: 72, height: 72, fontSize: 28,
          border: '2px solid #fff',
          boxShadow: pro
            ? '0 0 0 2px var(--color-pro), 0 4px 14px rgba(184,147,90,0.25)'
            : '0 4px 14px rgba(0,0,0,0.06)',
        }}
      >
        {initial}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <div
            className="text-[18px] font-extrabold leading-tight text-text"
            style={{ textWrap: 'pretty' }}
          >
            {profile?.name || 'Без имени'}
          </div>
          {pro ? (
            <span
              className="inline-flex items-center gap-1 text-[10.5px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{
                background: 'rgba(184,147,90,0.12)',
                border: '1px solid rgba(184,147,90,0.35)',
                color: 'var(--color-pro)',
                letterSpacing: 1,
              }}
            >
              <Crown size={10} strokeWidth={2.4} />
              Pro
            </span>
          ) : (
            <span
              className="text-[10.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full
                bg-bg-3 border border-border text-text-2"
              style={{ letterSpacing: 1 }}
            >
              Free
            </span>
          )}
        </div>
        {profile?.email && (
          <div className="text-[12.5px] mt-0.5 text-text-3 truncate">
            {profile.email}
          </div>
        )}
        {joined && (
          <div className="text-[11.5px] mt-1 text-text-3">
            С нами с {joined}
          </div>
        )}
      </div>
    </div>
  )
}

// ═══ Telegram row ════════════════════════════════════════════════
function TelegramRow({ profile, onConnect, tgLink, tgLoading, tgError }) {
  const connected = !!profile?.telegramId

  return (
    <div className="rounded-2xl bg-bg-2 border border-border p-4 flex items-center gap-3">
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
            : 'Управляй приложением прямо в Telegram'}
        </div>
        {tgError && (
          <div className="text-[12px] text-red-500 mt-1">{tgError}</div>
        )}
      </div>
      {connected ? (
        <span
          className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide
            bg-sage-muted border border-sage-border text-sage rounded-full px-2.5 py-1 shrink-0"
          style={{ letterSpacing: 0.3 }}
        >
          <Check size={11} strokeWidth={3} />
          Подключено
        </span>
      ) : tgLink ? (
        <a
          href={tgLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center bg-accent text-white text-[12px] font-bold
            rounded-full px-3.5 h-8 shrink-0"
        >
          Открыть бота →
        </a>
      ) : (
        <button
          type="button"
          onClick={onConnect}
          disabled={tgLoading}
          className="inline-flex items-center justify-center bg-accent text-white text-[12px] font-bold
            rounded-full px-3 h-8 shrink-0 disabled:opacity-60"
        >
          {tgLoading ? '...' : 'Подключить'}
        </button>
      )}
    </div>
  )
}

// ═══ Setting row (с right-slot) ══════════════════════════════════
function SettingRow({ Icon, label, right, onClick }) {
  const cls = 'rounded-xl bg-bg-2 border border-border p-4 flex items-center gap-3 w-full text-left transition-colors'
  const inner = (
    <>
      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-accent-muted">
        <Icon size={16} strokeWidth={2} className="text-accent" />
      </div>
      <div className="flex-1 text-[14px] font-semibold text-text">{label}</div>
      <div className="flex items-center gap-1 shrink-0">{right}</div>
    </>
  )
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${cls} active:bg-bg-3`}>
        {inner}
      </button>
    )
  }
  return <div className={cls}>{inner}</div>
}

// ═══ Language picker (свёрнутый/развёрнутый) ═════════════════════
function LanguagePicker({ current, onChange }) {
  const [open, setOpen] = useState(false)
  const cur = LANGUAGES.find(l => l.code === current) || LANGUAGES[0]

  function pick(code) {
    onChange(code)
    setOpen(false)
  }

  return (
    <div className="flex flex-col gap-2">
      <SettingRow
        Icon={Globe}
        label="Язык интерфейса"
        onClick={() => setOpen(o => !o)}
        right={
          <>
            <span className="text-[13px] text-text-3">
              {cur.label} {cur.flag}
            </span>
            <ChevronRight
              size={16}
              strokeWidth={2}
              className="text-text-3 transition-transform"
              style={{ transform: open ? 'rotate(90deg)' : 'rotate(0)' }}
            />
          </>
        }
      />
      {open && (
        <div className="rounded-xl bg-bg-2 border border-border overflow-hidden">
          {LANGUAGES.map((l, i) => {
            const on = l.code === current
            return (
              <button
                key={l.code}
                type="button"
                onClick={() => pick(l.code)}
                className={[
                  'flex items-center gap-2 px-4 h-11 text-[13.5px] w-full text-left transition-colors',
                  i > 0 ? 'border-t border-border' : '',
                  on ? 'text-accent font-bold' : 'text-text',
                ].join(' ')}
              >
                <span style={{ fontSize: 16 }}>{l.flag}</span>
                <span className="flex-1">{l.label}</span>
                {on && <Check size={14} strokeWidth={2.5} className="text-accent" />}
              </button>
            )
          })}
          <div
            className="px-4 py-2 text-[11px] text-text-3 border-t border-border"
            style={{ background: 'var(--color-bg-3)' }}
          >
            English перевод появится позже — пока подключена только инфраструктура.
          </div>
        </div>
      )}
    </div>
  )
}

// ═══ Action row (logout) ═════════════════════════════════════════
function ActionRow({ Icon, label, onClick, danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'w-full rounded-xl bg-bg-2 border border-border p-4 flex items-center gap-3 transition-colors',
        danger ? 'text-red-500 active:bg-red-50' : 'text-text active:bg-bg-3',
      ].join(' ')}
    >
      <Icon size={18} strokeWidth={2} className={danger ? 'text-red-500' : 'text-text-2'} />
      <span className="text-[14px] font-semibold">{label}</span>
    </button>
  )
}

// ═══ Main ════════════════════════════════════════════════════════
export default function ProfilePage() {
  const logout   = useStore(s => s.logout)
  const navigate = useNavigate()
  const { Toast } = useToast()

  const [profile, setProfile]     = useState(null)
  const [loading, setLoading]     = useState(true)
  const [tgLink, setTgLink]       = useState(null)
  const [tgLoading, setTgLoading] = useState(false)
  const [tgError, setTgError]     = useState('')
  const [lang, setLang]           = useState(() => i18n.language || 'ru')

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

  function changeLang(code) {
    setLang(code)
    i18n.changeLanguage(code)
    // i18n.changeLanguage сам пишет в localStorage.mealbot_lang (через LanguageDetector cache)
  }

  if (loading) return <Loader fullPage />

  return (
    <div>
      <div className="px-5 pt-1 pb-24 fade-in">
        <Hero profile={profile} />

        <div className="mt-7">
          <SectionLabel>Подключения</SectionLabel>
          <TelegramRow
            profile={profile}
            onConnect={connectTelegram}
            tgLink={tgLink}
            tgLoading={tgLoading}
            tgError={tgError}
          />
        </div>

        <div className="mt-7">
          <SectionLabel>Настройки</SectionLabel>
          <LanguagePicker current={lang} onChange={changeLang} />
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
